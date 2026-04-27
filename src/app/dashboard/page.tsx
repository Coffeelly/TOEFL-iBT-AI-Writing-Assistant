// =============================================================================
// Dashboard Page (RSC)
// =============================================================================
// Fetches progress data server-side and renders dashboard components.
// Protected by middleware — only authenticated users reach this page.
// Requirements: 12.1
// =============================================================================

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { STORAGE_KEYS } from '@/lib/constants'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart'
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart'
import { RecentSubmissions } from '@/components/dashboard/RecentSubmissions'
import type { DifficultyLevel, WritingMode } from '@/types'
import type { RubricBreakdown } from '@/types/feedback'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  // ---------------------------------------------------------------------------
  // Resolve authenticated user from cookie (middleware already validated it,
  // but we need the userId to query the DB)
  // ---------------------------------------------------------------------------
  const cookieStore = await cookies()
  const authToken = cookieStore.get(STORAGE_KEYS.AUTH_TOKEN)?.value ?? null
  const payload = authToken ? await verifyToken(authToken) : null

  if (!payload?.sub) {
    redirect('/login')
  }

  const userId = payload.sub

  // ---------------------------------------------------------------------------
  // Fetch user + all submissions in parallel
  // ---------------------------------------------------------------------------
  const [user, submissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentLevel: true, displayName: true },
    }),
    prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        overallScore: true,
        rubricScores: true,
        timeSpentSec: true,
        wordCount: true,
        createdAt: true,
        prompt: {
          select: { mode: true, title: true },
        },
      },
    }),
  ])

  if (!user) redirect('/login')

  // ---------------------------------------------------------------------------
  // Compute aggregates
  // ---------------------------------------------------------------------------
  const totalSubmissions = submissions.length
  const totalPracticeTimeSec = submissions.reduce((sum, s) => sum + s.timeSpentSec, 0)

  const scored = submissions.filter(
    (s): s is typeof s & { overallScore: number } => s.overallScore !== null,
  )

  const averageScore =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.overallScore, 0) / scored.length
      : null

  const bestScore = scored.length > 0 ? Math.max(...scored.map((s) => s.overallScore)) : null

  // Scores by mode
  const scoresByMode: Record<WritingMode, { dates: string[]; scores: number[] }> = {
    EMAIL: { dates: [], scores: [] },
    DISCUSSION: { dates: [], scores: [] },
  }
  for (const s of scored) {
    const mode = s.prompt.mode as WritingMode
    scoresByMode[mode].dates.push(s.createdAt.toISOString().split('T')[0])
    scoresByMode[mode].scores.push(s.overallScore)
  }

  // Rubric averages
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

  // Recent submissions (last 5, newest first) for the list component
  const recentSubmissions = [...submissions]
    .reverse()
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      mode: s.prompt.mode as WritingMode,
      promptTitle: s.prompt.title,
      overallScore: s.overallScore,
      wordCount: s.wordCount,
      createdAt: s.createdAt.toISOString(),
    }))

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.displayName}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Here&apos;s a summary of your TOEFL writing practice progress.
        </p>
      </div>

      {/* Stats overview */}
      <StatsOverview
        totalSubmissions={totalSubmissions}
        averageScore={averageScore}
        bestScore={bestScore}
        totalPracticeTimeSec={totalPracticeTimeSec}
        currentLevel={user.currentLevel as DifficultyLevel}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScoreTrendChart scoresByMode={scoresByMode} />
        <SkillRadarChart rubricAverages={rubricAverages} />
      </div>

      {/* Recent submissions */}
      <RecentSubmissions submissions={recentSubmissions} />
    </div>
  )
}
