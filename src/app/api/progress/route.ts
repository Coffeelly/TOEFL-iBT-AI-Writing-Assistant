import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { DifficultyLevel, WritingMode } from '@/types'
import type { RubricBreakdown } from '@/types/feedback'

// =============================================================================
// GET /api/progress
// =============================================================================
// Returns aggregated progress statistics for the authenticated user.
// Requirements: 12.2
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's current level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentLevel: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Fetch all submissions for the user, ordered oldest → newest for series
    const submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        overallScore: true,
        rubricScores: true,
        timeSpentSec: true,
        createdAt: true,
        prompt: {
          select: { mode: true },
        },
      },
    })

    const totalSubmissions = submissions.length
    const totalPracticeTimeSec = submissions.reduce((sum, s) => sum + s.timeSpentSec, 0)

    // Scored submissions only
    const scored = submissions.filter(
      (s): s is typeof s & { overallScore: number } => s.overallScore !== null,
    )

    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, s) => sum + s.overallScore, 0) / scored.length
        : null

    const bestScore =
      scored.length > 0 ? Math.max(...scored.map((s) => s.overallScore)) : null

    // Recent scores (last 5) for adaptive display
    const recentScores = scored
      .slice(-5)
      .map((s) => s.overallScore)

    // Scores by mode — date + score series per mode
    const scoresByMode: Record<WritingMode, { dates: string[]; scores: number[] }> = {
      EMAIL: { dates: [], scores: [] },
      DISCUSSION: { dates: [], scores: [] },
    }

    for (const s of scored) {
      const mode = s.prompt.mode as WritingMode
      scoresByMode[mode].dates.push(s.createdAt.toISOString().split('T')[0])
      scoresByMode[mode].scores.push(s.overallScore)
    }

    // Rubric averages across all scored submissions that have rubric data
    const withRubric = scored.filter((s) => s.rubricScores !== null)
    let rubricAverages: RubricBreakdown | null = null

    if (withRubric.length > 0) {
      const totals = { development: 0, organization: 0, language_use: 0, vocabulary: 0 }
      for (const s of withRubric) {
        const r = s.rubricScores as unknown as RubricBreakdown
        totals.development += r.development ?? 0
        totals.organization += r.organization ?? 0
        totals.language_use += r.language_use ?? 0
        totals.vocabulary += r.vocabulary ?? 0
      }
      const n = withRubric.length
      rubricAverages = {
        development: totals.development / n,
        organization: totals.organization / n,
        language_use: totals.language_use / n,
        vocabulary: totals.vocabulary / n,
      }
    }

    return NextResponse.json({
      totalSubmissions,
      averageScore,
      bestScore,
      totalPracticeTimeSec,
      currentLevel: user.currentLevel as DifficultyLevel,
      scoresByMode,
      rubricAverages,
      recentScores,
    })
  } catch (err) {
    console.error('[GET /api/progress]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
