'use client'

import Link from 'next/link'
import { useExamContext } from '@/contexts/ExamContext'

export function Footer() {
  const { isExamActive } = useExamContext()
  const currentYear = new Date().getFullYear()

  if (isExamActive) return null

  return (
    <footer className="border-t border-card-border bg-background-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700">
              <span className="text-xs font-bold text-white" aria-hidden="true">T</span>
            </div>
            <span className="text-sm font-semibold text-foreground-muted">
              TOEFL Helper
            </span>
          </div>

          {/* Links */}
          <nav className="flex gap-6" aria-label="Footer navigation">
            <Link
              href="/"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors focus-ring rounded"
            >
              Practice
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors focus-ring rounded"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors focus-ring rounded"
            >
              Settings
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-foreground-muted">
            &copy; {currentYear} TOEFL Helper. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
