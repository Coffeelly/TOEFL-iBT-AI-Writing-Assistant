// =============================================================================
// RecentSubmissions Component
// =============================================================================
// Lists the last 5 submissions with links to their history detail pages.
// Requirements: 12.5
// =============================================================================

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { WritingMode } from '@/types'

interface SubmissionSummary {
  id: string
  mode: WritingMode
  promptTitle: string
  overallScore: number | null
  wordCount: number
  createdAt: string
}

interface RecentSubmissionsProps {
  submissions: SubmissionSummary[]
}

function scoreVariant(score: number | null): 'error' | 'warning' | 'success' | 'default' {
  if (score === null) return 'default'
  if (score <= 2) return 'error'
  if (score === 3) return 'warning'
  return 'success'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  return (
    <Card title="Recent Submissions">
      {submissions.length === 0 ? (
        <p className="text-sm text-foreground-muted py-4 text-center">
          No submissions yet — start practicing to see your history here.
        </p>
      ) : (
        <ul className="divide-y divide-card-border -mx-5">
          {submissions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/history/${s.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-background-secondary transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-brand-600 transition-colors">
                    {s.promptTitle}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {formatDate(s.createdAt)} · {s.wordCount} words
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="default" size="sm">
                    {s.mode.charAt(0) + s.mode.slice(1).toLowerCase()}
                  </Badge>
                  <Badge variant={scoreVariant(s.overallScore)} size="sm">
                    {s.overallScore !== null ? `${s.overallScore} / 5` : 'N/A'}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {submissions.length > 0 && (
        <div className="mt-3 text-right">
          <Link
            href="/history"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all history →
          </Link>
        </div>
      )}
    </Card>
  )
}
