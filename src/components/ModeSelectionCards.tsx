'use client'

// =============================================================================
// Mode Selection Cards
// =============================================================================
// Links to the prompt selection page for each writing mode.
// =============================================================================

import Link from 'next/link'

export function ModeSelectionCards() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <Link
        href="/prompts/email"
        className="group flex flex-col items-center gap-3 rounded-xl border border-card-border bg-card-bg p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-300 focus-ring"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md transition-transform duration-200 group-hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Writing an Email</h2>
        <p className="text-sm text-foreground-muted">
          Practice composing clear, well-structured emails for various scenarios.
        </p>
        <span className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
          7 minutes · 100–130 words
        </span>
      </Link>

      <Link
        href="/prompts/discussion"
        className="group flex flex-col items-center gap-3 rounded-xl border border-card-border bg-card-bg p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-300 focus-ring"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md transition-transform duration-200 group-hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            <path d="M8 12h.01" />
            <path d="M12 12h.01" />
            <path d="M16 12h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Academic Discussion</h2>
        <p className="text-sm text-foreground-muted">
          Join a discussion, analyze opinions, and build persuasive arguments.
        </p>
        <span className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
          10 minutes · 100+ words
        </span>
      </Link>
    </div>
  )
}
