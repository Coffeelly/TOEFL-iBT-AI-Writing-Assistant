'use client'

// =============================================================================
// Guest Feedback Page
// =============================================================================
// Client component that reads the FeedbackResponse from sessionStorage and
// renders the full feedback UI. Shows a "Sign up to save your progress" banner.
// Requirements: 10.7, 13.2, 13.3, 13.4, 13.5
// =============================================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScoreCard } from '@/components/feedback/ScoreCard'
import { GrammarCorrections } from '@/components/feedback/GrammarCorrections'
import { VocabSuggestions } from '@/components/feedback/VocabSuggestions'
import { CoherenceAnalysis } from '@/components/feedback/CoherenceAnalysis'
import { StrengthsImprovements } from '@/components/feedback/StrengthsImprovements'
import { PolishedVersionPanel } from '@/components/feedback/PolishedVersionPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { FeedbackResponse } from '@/types/feedback'

const GUEST_FEEDBACK_KEY = 'toefl-helper-guest-feedback'

export default function GuestFeedbackPage() {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GUEST_FEEDBACK_KEY)
      if (!raw) {
        setError('No feedback found. Please complete a practice session first.')
        setIsLoading(false)
        return
      }
      const parsed = JSON.parse(raw) as FeedbackResponse
      setFeedback(parsed)
    } catch {
      setError('Could not load feedback. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" label="Loading feedback…" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error / missing state
  // ---------------------------------------------------------------------------
  if (error || !feedback) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center space-y-4">
        <p className="text-foreground-muted">{error ?? 'No feedback available.'}</p>
        <Button variant="primary" onClick={() => router.push('/')}>
          Start a Practice Session
        </Button>
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // Render feedback
  // ---------------------------------------------------------------------------
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Feedback</h1>
        <p className="text-sm text-foreground-muted mt-1">Guest session — results are not saved</p>
      </div>

      {/* Sign-up banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/20 px-5 py-4"
        role="complementary"
        aria-label="Sign up prompt"
      >
        <div className="flex items-center gap-2 flex-1">
          <Badge variant="brand" size="md">Guest</Badge>
          <p className="text-sm text-foreground">
            <span className="font-medium">Sign up to save your progress</span> and track your
            improvement over time.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/register')}
          >
            Sign Up Free
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/login')}
          >
            Log In
          </Button>
        </div>
      </div>

      {/* Score overview */}
      <ScoreCard
        overallScore={feedback.overall_score}
        rubricBreakdown={feedback.rubric_breakdown}
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

      {/* Polished version — no original essay available for guests */}
      <div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-sm">
          <div className="border-b border-card-border px-5 py-4">
            <h3 className="text-base font-semibold text-foreground">Polished Version</h3>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 mb-2">
              AI-Polished Essay
            </p>
            <div className="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/20 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {feedback.polished_version}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation actions */}
      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
        <Button variant="primary" onClick={() => router.push('/')}>
          Try Again
        </Button>
        <Button variant="outline" onClick={() => router.push('/register')}>
          Sign Up to Save Progress
        </Button>
      </div>
    </main>
  )
}
