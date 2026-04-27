'use client'

// =============================================================================
// WritingEditor Component
// =============================================================================
// Timed writing editor with live word count, warning states, submit
// confirmation modal, and navigation guard.
// Requirements: 6.7, 6.8, 6.9, 6.11
// =============================================================================

import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useTimer } from '@/hooks/useTimer'
import { useWordCount } from '@/hooks/useWordCount'
import { TIMER_DURATION_SECONDS } from '@/lib/constants'
import type { WritingMode } from '@/types'

interface WritingEditorProps {
  mode: WritingMode
  value: string
  onChange: (text: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  showConfirmModal: boolean
  onConfirmSubmit: () => void
  onCancelSubmit: () => void
}

/** Formats seconds as MM:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function WritingEditor({
  mode,
  value,
  onChange,
  onSubmit,
  isSubmitting,
  showConfirmModal,
  onConfirmSubmit,
  onCancelSubmit,
}: WritingEditorProps) {
  const { secondsLeft, isWarning, isExpired, start } = useTimer(TIMER_DURATION_SECONDS[mode])
  const { wordCount, meetsMinimum } = useWordCount(value, mode)

  // Start timer on mount
  useEffect(() => {
    start()
  }, [start])

  // Auto-submit when timer expires
  useEffect(() => {
    if (isExpired && value.trim().length > 0) {
      onSubmit()
    }
  }, [isExpired, value, onSubmit])

  // Warn on navigation away with unsaved text
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (value.trim().length > 0) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  const isEmpty = value.trim().length === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Timer + word count bar */}
      <div className="flex items-center justify-between rounded-lg border border-card-border bg-background-secondary px-4 py-2">
        {/* Timer */}
        <div
          className={`flex items-center gap-2 font-mono text-lg font-semibold tabular-nums transition-colors ${
            isExpired
              ? 'text-error'
              : isWarning
                ? 'animate-pulse text-error'
                : 'text-foreground'
          }`}
          aria-live="polite"
          aria-label={`Time remaining: ${formatTime(secondsLeft)}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {isExpired ? 'Time up' : formatTime(secondsLeft)}
        </div>

        {/* Word count */}
        <div
          className={`text-sm font-medium transition-colors ${
            meetsMinimum ? 'text-success' : 'text-foreground-muted'
          }`}
          aria-live="polite"
          aria-label={`Word count: ${wordCount}`}
        >
          {wordCount} words
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={handleChange}
        disabled={isSubmitting || isExpired}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder="Start writing your response here…"
        aria-label="Essay editor"
        className="
          min-h-[320px] w-full resize-y rounded-xl border border-card-border
          bg-card-bg px-4 py-3 font-sans text-base text-foreground
          placeholder:text-foreground-muted/50
          focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-colors
        "
      />

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          disabled={isEmpty || isSubmitting}
          isLoading={isSubmitting}
          onClick={onSubmit}
          aria-label="Submit essay for evaluation"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              Evaluating…
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </div>

      {/* Submit confirmation modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={onCancelSubmit}
        title="Submit your essay?"
      >
        <p className="text-foreground-muted">
          Your essay will be sent for AI evaluation. You won&apos;t be able to edit it after submitting.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancelSubmit}>
            Keep writing
          </Button>
          <Button variant="primary" onClick={onConfirmSubmit}>
            Submit
          </Button>
        </div>
      </Modal>
    </div>
  )
}
