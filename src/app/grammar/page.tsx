'use client'

// =============================================================================
// Grammar Fix Page
// =============================================================================
// Realtime grammar correction tool. The user types in the left panel and
// the corrected version appears in the right panel as they type (debounced).
// LLM calls are made directly from the browser using the stored LLM config.
// =============================================================================

import { useState, useId } from 'react'
import { useGrammarFix } from '@/hooks/useGrammarFix'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { Metadata } from 'next'

// ---------------------------------------------------------------------------
// Copy button (clipboard)
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      aria-label={copied ? 'Copied!' : 'Copy corrected text'}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors focus-ring disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GrammarFixPage() {
  const [inputText, setInputText] = useState('')
  const { correctedText, isLoading, error, retry } = useGrammarFix(inputText)
  const inputId = useId()

  const charCount = inputText.length
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0

  // Determine what to show in the output panel
  const isEmpty = !inputText.trim() || inputText.trim().length < 10
  const showPlaceholder = isEmpty && !isLoading
  const showLoading = isLoading
  const showError = !isLoading && !!error
  const showResult = !isLoading && !error && !isEmpty && !!correctedText

  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <div className="border-b border-card-border bg-background-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Grammar Fix</h1>
              <p className="mt-1 text-sm text-foreground-muted">
                Type or paste your text and get a corrected version in real time.
              </p>
            </div>
            <p className="text-xs text-foreground-muted">
              Uses your{' '}
              <Link href="/settings" className="text-brand-600 dark:text-brand-400 hover:underline focus-ring rounded">
                configured LLM
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">

          {/* ── Input panel ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={inputId}
                className="text-sm font-semibold text-foreground"
              >
                Your text
              </label>
              <span className="text-xs text-foreground-muted" aria-live="polite">
                {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars
              </span>
            </div>

            <textarea
              id={inputId}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste your text here…"
              spellCheck
              className="
                flex-1 min-h-[320px] w-full resize-none rounded-xl border border-card-border
                bg-card-bg px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/60
                leading-relaxed
                focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                transition-colors
              "
              aria-label="Input text for grammar correction"
            />

            {inputText && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-xs text-foreground-muted hover:text-foreground transition-colors focus-ring rounded cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* ── Output panel ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Corrected version
              </span>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <span className="text-xs text-foreground-muted" aria-live="polite">
                    Checking…
                  </span>
                )}
                {showResult && <CopyButton text={correctedText} />}
              </div>
            </div>

            <div
              className="
                flex-1 min-h-[320px] rounded-xl border border-card-border
                bg-card-bg px-4 py-3 text-sm leading-relaxed
                relative overflow-auto
              "
              aria-live="polite"
              aria-label="Corrected text output"
            >
              {/* Placeholder */}
              {showPlaceholder && (
                <p className="text-foreground-muted/60 select-none">
                  {!inputText.trim()
                    ? 'The corrected version will appear here…'
                    : 'Keep typing — correction starts after 10 characters.'}
                </p>
              )}

              {/* Loading skeleton */}
              {showLoading && (
                <div className="flex flex-col gap-3" aria-hidden="true">
                  <div className="flex items-center gap-2 mb-1">
                    <Spinner size="sm" />
                    <span className="text-xs text-foreground-muted">Analyzing your text…</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-3.5 w-full animate-pulse rounded bg-background-secondary" />
                    <div className="h-3.5 w-5/6 animate-pulse rounded bg-background-secondary" />
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-background-secondary" />
                    <div className="h-3.5 w-full animate-pulse rounded bg-background-secondary" />
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-background-secondary" />
                  </div>
                </div>
              )}

              {/* Error state */}
              {showError && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/40 dark:bg-red-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-red-500" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={retry} className="self-start">
                    Try again
                  </Button>
                </div>
              )}

              {/* Result */}
              {showResult && (
                <p className="whitespace-pre-wrap text-foreground">{correctedText}</p>
              )}
            </div>

            {/* Diff hint */}
            {showResult && correctedText === inputText.trim() && (
              <p className="text-xs text-foreground-muted flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Looks good — no corrections needed.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
