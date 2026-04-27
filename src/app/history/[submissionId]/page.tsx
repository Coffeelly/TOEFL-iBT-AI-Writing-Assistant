// =============================================================================
// History Detail Page (RSC)
// =============================================================================
// Fetches a single submission by ID and renders the full feedback view,
// reusing the same feedback display components as the feedback page.
// Returns 404 if the submission doesn't exist or belongs to a different user.
// Requirements: 12.7
// =============================================================================

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { STORAGE_KEYS } from '@/lib/constants'
import { ScoreCard } from '@/components/feedback/ScoreCard'
import { GrammarCorrections } from '@/components/feedback/GrammarCorrections'
import { VocabSuggestions } from '@/components/feedback/VocabSuggestions'
import { CoherenceAnalysis } from '@/components/feedback/CoherenceAnalysis'
import { StrengthsImprovements } from '@/components/feedback/StrengthsImprovements'
import { PolishedVersionPanel } from '@/components/feedback/PolishedVersionPanel'
import { ActionButtons } from '@/components/feedback/ActionButtons'
import { Badge } from '@/components/ui/Badge'
import type { FeedbackResponse, RubricBreakdown } from '@/types/feedback'
import type { DifficultyLevel, WritingMode } from '@/types'
import type { Metadata } from 'next'

interface HistoryDetailPageProps {
  params: Promise<{ submissionId: string }>
}

export const metadata: Metadata = {
  title: 'Submission Detail',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function difficultyVariant(
  difficulty: DifficultyLevel,
): 'success' | 'warning' | 'error' {
  if (difficulty === 'BEGINNER') return 'success'
  if (difficulty === 'INTERMEDIATE') return 'warning'
  return 'error'
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { submissionId } = await params

  // ---------------------------------------------------------------------------
  // Resolve authenticated user
  // ---------------------------------------------------------------------------
  const cookieStore = await cookies()
  const authToken = cookieStore.get(STORAGE_KEYS.AUTH_TOKEN)?.value ?? null
  const payload = authToken ? await verifyToken(authToken) : null

  if (!payload?.sub) {
    redirect('/login')
  }

  const currentUserId = payload.sub

  // ---------------------------------------------------------------------------
  // Fetch submission
  // ---------------------------------------------------------------------------
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { prompt: true },
  })

  if (!submission) notFound()

  // Only the owning user may view their submission
  if (submission.userId && submission.userId !== currentUserId) {
    notFound()
  }

  // ---------------------------------------------------------------------------
  // Parse stored JSON fields
  // ---------------------------------------------------------------------------
  const feedback = submission.feedbackJson as FeedbackResponse | null
  const rubricScores = submission.rubricScores as RubricBreakdown | null

  if (!feedback) notFound()

  const mode = submission.prompt.mode as WritingMode
  const difficulty = submission.prompt.difficulty as DifficultyLevel

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-foreground-muted" aria-label="Breadcrumb">
        <Link href="/history" className="hover:text-brand-600 transition-colors">
          History
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-foreground truncate max-w-xs">{submission.prompt.title}</span>
      </nav>

      {/* Page heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{submission.prompt.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
          <span>{formatDate(submission.createdAt.toISOString())}</span>
          <span aria-hidden="true">·</span>
          <span>{submission.wordCount} words</span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(submission.timeSpentSec)}</span>
          {submission.llmProvider && (
            <>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{submission.llmProvider.toLowerCase()}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={mode === 'EMAIL' ? 'brand' : 'default'} size="sm">
            {mode.charAt(0) + mode.slice(1).toLowerCase()}
          </Badge>
          <Badge variant={difficultyVariant(difficulty)} size="sm">
            {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
          </Badge>
        </div>
      </div>

      {/* Score overview */}
      <ScoreCard
        overallScore={feedback.overall_score}
        rubricBreakdown={rubricScores ?? feedback.rubric_breakdown}
      />

      {/* Strengths & improvements */}
      <StrengthsImprovements
        strengths={feedback.strengths}
        improvements={feedback.improvements}
      />

      {/* Coherence analysis */}
      <CoherenceAnalysis analysis={feedback.coherence_analysis} />

      {/* Grammar corrections */}
      <GrammarCorrections corrections={feedback.grammar_corrections} />

      {/* Vocabulary suggestions */}
      <VocabSuggestions suggestions={feedback.vocabulary_suggestions} />

      {/* Polished version comparison */}
      <PolishedVersionPanel
        originalEssay={submission.essayText}
        polishedVersion={feedback.polished_version}
      />

      {/* Navigation actions */}
      <ActionButtons mode={mode} promptId={submission.promptId} />
    </main>
  )
}
