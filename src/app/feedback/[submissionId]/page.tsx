// =============================================================================
// Feedback Page (RSC)
// =============================================================================
// Fetches a submission from the database and renders all feedback components.
// Returns 404 if the submission doesn't exist or belongs to a different user.
// Requirements: 10.1, 10.5, 10.6, 10.8
// =============================================================================

import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
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
import type { FeedbackResponse, RubricBreakdown } from '@/types/feedback'
import type { WritingMode } from '@/types'

interface FeedbackPageProps {
  params: Promise<{ submissionId: string }>
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { submissionId } = await params

  // ---------------------------------------------------------------------------
  // Resolve the current user (if authenticated) from the auth cookie
  // ---------------------------------------------------------------------------
  const cookieStore = await cookies()
  const authToken = cookieStore.get(STORAGE_KEYS.AUTH_TOKEN)?.value ?? null
  const payload = authToken ? await verifyToken(authToken) : null
  const currentUserId = payload?.sub ?? null

  // ---------------------------------------------------------------------------
  // Fetch submission
  // ---------------------------------------------------------------------------
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { prompt: true },
  })

  // 404 if not found
  if (!submission) notFound()

  // 404 (not 403) if the submission belongs to a different authenticated user
  // Guest submissions (userId === null) are accessible by anyone with the URL
  if (submission.userId && currentUserId && submission.userId !== currentUserId) {
    notFound()
  }

  // ---------------------------------------------------------------------------
  // Parse stored JSON fields
  // ---------------------------------------------------------------------------
  const feedback = submission.feedbackJson as FeedbackResponse | null
  const rubricScores = submission.rubricScores as RubricBreakdown | null

  if (!feedback) notFound()

  const mode = submission.prompt.mode as WritingMode

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Feedback</h1>
        <p className="text-sm text-foreground-muted mt-1">
          {submission.prompt.title} ·{' '}
          <span className="capitalize">{mode.toLowerCase()}</span> ·{' '}
          {submission.wordCount} words
        </p>
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
