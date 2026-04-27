'use client'

// =============================================================================
// PracticeShell Component
// =============================================================================
// Client component that holds the full practice session state:
// prompt display, essay text, LLM evaluation, submission persistence,
// navigation to the feedback page, and exclusive exam mode.
// Requirements: 6.1, 6.5, 9.1, 9.2, 9.3, 13.1, 13.2
// =============================================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { WritingEditor } from './WritingEditor'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useLlmEvaluation } from '@/hooks/useLlmEvaluation'
import { useExamMode } from '@/hooks/useExamMode'
import { useExamContext } from '@/contexts/ExamContext'
import { STORAGE_KEYS, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/constants'
import { OllamaClient } from '@/lib/llm/ollama'
import type { LlmConfig, WritingMode } from '@/types'
import type { Prompt, EmailPrompt, AcademicDiscussionPrompt } from '@/types/prompt'
import type { FeedbackResponse } from '@/types/feedback'

interface PracticeShellProps {
  prompt: Prompt
  mode: WritingMode
}

// ---------------------------------------------------------------------------
// Prompt display sub-components
// ---------------------------------------------------------------------------

function EmailPromptCard({ prompt }: { prompt: EmailPrompt }) {
  const lines = prompt.scenarioText.split('\n').map((l) => l.trim()).filter(Boolean)

  const bullets: string[] = []
  let instructionLine = ''
  let closingLine = ''
  const contextLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('•')) {
      bullets.push(line.replace(/^•\s*/, ''))
    } else if (line.toLowerCase().startsWith('write an email') || line.toLowerCase().startsWith('write a')) {
      if (line.toLowerCase().includes('complete sentences')) {
        closingLine = line
      } else {
        instructionLine = line
      }
    } else {
      contextLines.push(line)
    }
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="brand">Email Task</Badge>
        <span className="text-sm text-foreground-muted">7 minutes · 100–130 words</span>
      </div>
      <p className="text-foreground leading-relaxed mb-4">{contextLines.join(' ')}</p>
      {instructionLine && (
        <div className="mb-4">
          <p className="text-foreground leading-relaxed mb-2">{instructionLine}</p>
          {bullets.length > 0 && (
            <ul className="space-y-2 ml-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {closingLine && (
        <p className="text-foreground-muted text-sm text-center mt-4">{closingLine}</p>
      )}
    </Card>
  )
}

function DiscussionPromptCard({ prompt }: { prompt: AcademicDiscussionPrompt }) {
  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="brand">Academic Discussion</Badge>
        <span className="text-sm text-foreground-muted">10 minutes · 100+ words</span>
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{prompt.title}</h2>
      <p className="text-foreground-muted leading-relaxed whitespace-pre-wrap mb-4">
        {prompt.scenarioText}
      </p>
      {prompt.professorPrompt && (
        <div className="rounded-lg border border-card-border bg-background-secondary p-4 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1">Professor</p>
          <p className="text-foreground leading-relaxed">{prompt.professorPrompt}</p>
        </div>
      )}
      {(prompt.studentOpinionA || prompt.studentOpinionB) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {prompt.studentOpinionA && (
            <div className="rounded-lg border border-card-border bg-background-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1">Student A</p>
              <p className="text-foreground leading-relaxed">{prompt.studentOpinionA}</p>
            </div>
          )}
          {prompt.studentOpinionB && (
            <div className="rounded-lg border border-card-border bg-background-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1">Student B</p>
              <p className="text-foreground leading-relaxed">{prompt.studentOpinionB}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function PromptDisplay({ prompt, mode }: { prompt: Prompt; mode: WritingMode }) {
  if (mode === 'EMAIL') return <EmailPromptCard prompt={prompt as EmailPrompt} />
  return <DiscussionPromptCard prompt={prompt as AcademicDiscussionPrompt} />
}

// ---------------------------------------------------------------------------
// Evaluation overlay
// ---------------------------------------------------------------------------

function EvaluationOverlay({ stage }: { stage: 'evaluating' | 'saving' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" label={stage === 'evaluating' ? 'Evaluating your essay…' : 'Saving your submission…'} />
      <p className="text-foreground-muted text-sm">
        {stage === 'evaluating' ? 'Your essay is being evaluated by the AI rater…' : 'Saving your results…'}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error banner
// ---------------------------------------------------------------------------

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 flex items-start gap-3" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-error" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-error">Evaluation failed</p>
        <p className="text-sm text-foreground-muted mt-0.5">{message}</p>
      </div>
      <button onClick={onRetry} className="shrink-0 text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors">
        Retry
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pre-test confirmation screen
// ---------------------------------------------------------------------------

function PreTestScreen({
  prompt,
  mode,
  onStart,
}: {
  prompt: Prompt
  mode: WritingMode
  onStart: () => void
}) {
  const modeLabel = mode === 'EMAIL' ? 'Writing an Email' : 'Academic Discussion'
  const duration = mode === 'EMAIL' ? '7 minutes' : '10 minutes'
  const wordTarget = mode === 'EMAIL' ? '100–130 words' : '100+ words'

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-lg">
        <Card className="p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600 dark:text-brand-400" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{prompt.title}</h1>
          <p className="text-sm text-foreground-muted mb-6">{modeLabel}</p>

          {/* Rules */}
          <div className="rounded-lg border border-card-border bg-background-secondary p-4 text-left mb-6 space-y-2">
            <p className="text-sm font-semibold text-foreground mb-3">Before you begin:</p>
            <div className="flex items-start gap-2 text-sm text-foreground-muted">
              <span className="mt-0.5 text-brand-500" aria-hidden="true">⏱</span>
              <span>You have <strong className="text-foreground">{duration}</strong> to complete this task.</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-foreground-muted">
              <span className="mt-0.5 text-brand-500" aria-hidden="true">✍</span>
              <span>Target length: <strong className="text-foreground">{wordTarget}</strong>.</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-foreground-muted">
              <span className="mt-0.5 text-amber-500" aria-hidden="true">⚠</span>
              <span>The test will enter <strong className="text-foreground">fullscreen mode</strong>. Navigation will be blocked until you submit.</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-foreground-muted">
              <span className="mt-0.5 text-amber-500" aria-hidden="true">⚠</span>
              <span>If you exit fullscreen, you will have <strong className="text-foreground">10 seconds</strong> to return before your essay is auto-submitted.</span>
            </div>
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={onStart}>
            Start Test
          </Button>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fullscreen exit warning overlay
// ---------------------------------------------------------------------------

function FullscreenExitWarning({
  countdown,
  onReturn,
  onSubmitNow,
  isEmpty,
}: {
  countdown: number
  onReturn: () => void
  onSubmitNow: () => void
  isEmpty: boolean
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-xl border border-amber-500/30 bg-card-bg p-8 text-center shadow-2xl">
        {/* Warning icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">You left fullscreen!</h2>
        <p className="text-sm text-foreground-muted mb-6">
          Your test is still running. Return to fullscreen to continue, or your essay will be auto-submitted in:
        </p>

        {/* Countdown */}
        <div className="mb-6 text-6xl font-bold tabular-nums text-amber-500" aria-live="assertive" aria-label={`${countdown} seconds remaining`}>
          {countdown}
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" onClick={onReturn}>
            Return to Fullscreen
          </Button>
          <Button variant="outline" onClick={onSubmitNow}>
            {isEmpty ? 'Cancel Test' : 'Submit Now'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PracticeShell
// ---------------------------------------------------------------------------

type SubmissionStage = 'idle' | 'evaluating' | 'saving'

export function PracticeShell({ prompt, mode }: PracticeShellProps) {
  const router = useRouter()
  const { evaluate, error: llmError } = useLlmEvaluation()
  const { setExamActive } = useExamContext()

  const [essayText, setEssayText] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [stage, setStage] = useState<SubmissionStage>('idle')
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  // We need a stable ref to runSubmission for useExamMode's onAutoSubmit
  const runSubmissionRef = useRef<((essay: string) => Promise<void>) | null>(null)
  // Ref for endExam to break the circular dependency with handleAutoSubmit
  const endExamRef = useRef<(() => Promise<void>) | null>(null)

  const isSubmitting = stage !== 'idle'

  // ---------------------------------------------------------------------------
  // Exam mode
  // ---------------------------------------------------------------------------

  const handleAutoSubmit = useCallback(() => {
    if (essayText.trim().length === 0) {
      // Nothing written — cancel the test instead of sending empty text to the LLM
      void endExamRef.current?.().then(() => {
        const modeSlug = mode === 'EMAIL' ? 'email' : 'discussion'
        router.push(`/prompts/${modeSlug}`)
      })
      return
    }
    if (runSubmissionRef.current) {
      void runSubmissionRef.current(essayText)
    }
  }, [essayText, mode, router])

  const { phase, exitCountdown, startExam, endExam, returnToFullscreen } = useExamMode({
    onAutoSubmit: handleAutoSubmit,
  })

  // Keep endExam ref in sync
  useEffect(() => {
    endExamRef.current = endExam
  }, [endExam])

  // Sync exam active state with the context so the Header hides itself
  useEffect(() => {
    setExamActive(phase === 'active' || phase === 'exit-warning')
    return () => setExamActive(false)
  }, [phase, setExamActive])

  // ---------------------------------------------------------------------------
  // Ollama warm-up
  // ---------------------------------------------------------------------------

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG)
      const config: LlmConfig = raw
        ? (JSON.parse(raw) as LlmConfig)
        : { provider: 'OLLAMA', ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT, geminiApiKey: '' }
      if (config.provider === 'OLLAMA') {
        const client = new OllamaClient(config.ollamaEndpoint ?? DEFAULT_OLLAMA_ENDPOINT)
        void client.warmUp()
      }
    } catch {
      // Best-effort
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Core submission flow
  // ---------------------------------------------------------------------------

  const runSubmission = useCallback(
    async (essay: string) => {
      setSubmissionError(null)
      setStage('evaluating')

      let feedback: FeedbackResponse
      try {
        feedback = await evaluate(essay, prompt, mode)
      } catch (err) {
        setStage('idle')
        setSubmissionError(err instanceof Error ? err.message : 'Evaluation failed. Please try again.')
        return
      }

      setStage('saving')
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const wordCount = essay.trim() === '' ? 0 : essay.trim().split(/\s+/).length
        const body = {
          promptId: prompt.id,
          essayText: essay,
          wordCount,
          timeSpentSec: 0,
          overallScore: feedback.overall_score,
          rubricScores: feedback.rubric_breakdown,
          feedbackJson: feedback,
          polishedVersion: feedback.polished_version,
          llmProvider: localStorage.getItem(STORAGE_KEYS.LLM_CONFIG)
            ? (JSON.parse(localStorage.getItem(STORAGE_KEYS.LLM_CONFIG)!).provider ?? 'OLLAMA')
            : 'OLLAMA',
        }

        // Exit exam mode before navigating
        await endExam()

        if (token) {
          const res = await fetch('/api/submissions', { method: 'POST', headers, body: JSON.stringify(body) })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error ?? `Server error (${res.status})`)
          }
          const { submissionId } = await res.json()
          router.push(`/feedback/${submissionId}`)
        } else {
          const res = await fetch('/api/submissions', { method: 'POST', headers, body: JSON.stringify(body) })
          if (!res.ok) console.warn('[PracticeShell] Guest submission persistence failed')
          sessionStorage.setItem('toefl-helper-guest-feedback', JSON.stringify(feedback))
          router.push('/feedback/guest')
        }
      } catch (err) {
        setStage('idle')
        setSubmissionError(err instanceof Error ? err.message : 'Failed to save your submission. Please try again.')
      }
    },
    [evaluate, prompt, mode, router, endExam],
  )

  // Keep ref up to date
  useEffect(() => {
    runSubmissionRef.current = runSubmission
  }, [runSubmission])

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  const handleSubmitRequest = useCallback(() => {
    if (essayText.trim().length === 0) return
    setShowConfirmModal(true)
  }, [essayText])

  const handleConfirmSubmit = useCallback(async () => {
    setShowConfirmModal(false)
    await runSubmission(essayText)
  }, [essayText, runSubmission])

  const handleCancelSubmit = useCallback(() => {
    setShowConfirmModal(false)
  }, [])

  const handleRetry = useCallback(() => {
    setSubmissionError(null)
  }, [])

  // Cancels the test entirely — exits exam mode and goes back to the prompt list.
  // Used when the essay is empty and submission would be pointless.
  const handleCancelTest = useCallback(async () => {
    await endExam()
    const modeSlug = mode === 'EMAIL' ? 'email' : 'discussion'
    router.push(`/prompts/${modeSlug}`)
  }, [endExam, mode, router])

  const handleSubmitNow = useCallback(() => {
    if (essayText.trim().length === 0) {
      void handleCancelTest()
      return
    }
    void runSubmission(essayText)
  }, [essayText, runSubmission, handleCancelTest])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Phase: pre — show confirmation screen
  if (phase === 'pre') {
    return <PreTestScreen prompt={prompt} mode={mode} onStart={startExam} />
  }

  return (
    <>
      {/* Fullscreen exit warning */}
      {phase === 'exit-warning' && (
        <FullscreenExitWarning
          countdown={exitCountdown}
          onReturn={returnToFullscreen}
          onSubmitNow={handleSubmitNow}
          isEmpty={essayText.trim().length === 0}
        />
      )}

      {/* Evaluation overlay */}
      {isSubmitting && <EvaluationOverlay stage={stage} />}

      {/* Main content — fills the screen in fullscreen mode */}
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <PromptDisplay prompt={prompt} mode={mode} />

        {(submissionError ?? llmError) && (
          <div className="mb-4">
            <ErrorBanner
              message={submissionError ?? llmError ?? 'Unknown error'}
              onRetry={handleRetry}
            />
          </div>
        )}

        <WritingEditor
          mode={mode}
          value={essayText}
          onChange={setEssayText}
          onSubmit={handleSubmitRequest}
          isSubmitting={isSubmitting}
          showConfirmModal={showConfirmModal}
          onConfirmSubmit={handleConfirmSubmit}
          onCancelSubmit={handleCancelSubmit}
        />
      </div>
    </>
  )
}
