// =============================================================================
// History List Page (RSC)
// =============================================================================
// Fetches the authenticated user's submission history server-side and renders
// a paginated list with date, mode badge, score badge, prompt title, and a
// link to the detail page.
// Requirements: 12.6
// =============================================================================

import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { STORAGE_KEYS } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { DifficultyLevel, WritingMode } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History',
}

const PAGE_SIZE = 20

interface HistoryPageProps {
  searchParams: Promise<{ page?: string }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreVariant(score: number | null): 'error' | 'warning' | 'success' | 'default' {
  if (score === null) return 'default'
  if (score <= 2) return 'error'
  if (score === 3) return 'warning'
  return 'success'
}

function modeVariant(mode: WritingMode): 'brand' | 'default' {
  return mode === 'EMAIL' ? 'brand' : 'default'
}

function difficultyVariant(
  difficulty: DifficultyLevel,
): 'success' | 'warning' | 'error' {
  if (difficulty === 'BEGINNER') return 'success'
  if (difficulty === 'INTERMEDIATE') return 'warning'
  return 'error'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  // Resolve authenticated user
  const cookieStore = await cookies()
  const authToken = cookieStore.get(STORAGE_KEYS.AUTH_TOKEN)?.value ?? null
  const payload = authToken ? await verifyToken(authToken) : null

  if (!payload?.sub) {
    redirect('/login')
  }

  const userId = payload.sub

  // Parse page param
  const resolvedParams = await searchParams
  const page = Math.max(1, parseInt(resolvedParams.page ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  // Fetch submissions + total count in parallel
  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        prompt: { select: { title: true, mode: true, difficulty: true } },
      },
    }),
    prisma.submission.count({ where: { userId } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Submission History</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {total === 0
            ? 'No submissions yet.'
            : `${total} submission${total !== 1 ? 's' : ''} total`}
        </p>
      </div>

      {/* Submission list */}
      {submissions.length === 0 ? (
        <Card>
          <div className="py-12 text-center space-y-3">
            <p className="text-foreground-muted">You haven&apos;t submitted any essays yet.</p>
            <Link
              href="/"
              className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Start practicing →
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-card-border -mx-5 -my-4">
            {submissions.map((s) => {
              const mode = s.prompt.mode as WritingMode
              const difficulty = s.prompt.difficulty as DifficultyLevel
              return (
                <li key={s.id}>
                  <Link
                    href={`/history/${s.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-background-secondary transition-colors group"
                  >
                    {/* Date column */}
                    <div className="w-24 shrink-0 text-xs text-foreground-muted tabular-nums">
                      {formatDate(s.createdAt.toISOString())}
                    </div>

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-brand-600 transition-colors">
                        {s.prompt.title}
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {s.wordCount} words · {formatDuration(s.timeSpentSec)}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={modeVariant(mode)} size="sm">
                        {mode.charAt(0) + mode.slice(1).toLowerCase()}
                      </Badge>
                      <Badge variant={difficultyVariant(difficulty)} size="sm">
                        {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
                      </Badge>
                      <Badge variant={scoreVariant(s.overallScore)} size="sm">
                        {s.overallScore !== null ? `${s.overallScore} / 5` : 'N/A'}
                      </Badge>
                    </div>

                    {/* Arrow */}
                    <span
                      className="text-foreground-muted group-hover:text-brand-600 transition-colors shrink-0"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between"
          aria-label="Pagination"
        >
          <p className="text-sm text-foreground-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/history?page=${page - 1}`}
                className="rounded-lg border border-card-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/history?page=${page + 1}`}
                className="rounded-lg border border-card-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
