import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// =============================================================================
// GET /api/submissions/:id
// =============================================================================
// Returns a single submission with full feedback and prompt details.
// Requirements: 9.6, 9.7
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')

    // Fetch submission with prompt included
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { prompt: true },
    })

    // Return 404 if not found
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Return 403 if submission belongs to a different user
    // (only check if submission has a userId — guest submissions are accessible by URL)
    if (submission.userId && userId && submission.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return full submission detail
    return NextResponse.json({
      id: submission.id,
      essayText: submission.essayText,
      wordCount: submission.wordCount,
      timeSpentSec: submission.timeSpentSec,
      overallScore: submission.overallScore,
      rubricScores: submission.rubricScores,
      feedbackJson: submission.feedbackJson,
      polishedVersion: submission.polishedVersion,
      llmProvider: submission.llmProvider,
      createdAt: submission.createdAt.toISOString(),
      prompt: {
        id: submission.prompt.id,
        mode: submission.prompt.mode,
        difficulty: submission.prompt.difficulty,
        title: submission.prompt.title,
        scenarioText: submission.prompt.scenarioText,
        professorPrompt: submission.prompt.professorPrompt,
        studentOpinionA: submission.prompt.studentOpinionA,
        studentOpinionB: submission.prompt.studentOpinionB,
      },
    })
  } catch (err) {
    console.error('[GET /api/submissions/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
