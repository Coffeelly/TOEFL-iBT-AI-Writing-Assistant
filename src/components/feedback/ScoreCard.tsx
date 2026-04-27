// =============================================================================
// ScoreCard Component
// =============================================================================
// Displays the overall ETS score as a color-coded badge plus a breakdown
// of the four rubric sub-dimensions.
// Requirements: 10.1, 10.2
// =============================================================================

import { Card } from '@/components/ui/Card'
import type { RubricBreakdown } from '@/types/feedback'

interface ScoreCardProps {
  overallScore: number
  rubricBreakdown: RubricBreakdown
}

/** Returns Tailwind color classes based on the ETS score range. */
function scoreColorClasses(score: number): { bg: string; text: string; ring: string } {
  if (score <= 2) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', ring: 'ring-red-300 dark:ring-red-700' }
  if (score === 3) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-300 dark:ring-amber-700' }
  return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-300 dark:ring-emerald-700' }
}

/** A thin horizontal bar representing a score out of 5. */
function ScoreBar({ score }: { score: number }) {
  const pct = Math.round((score / 5) * 100)
  const { bg: fillBg } = scoreColorClasses(score)
  return (
    <div className="h-2 w-full rounded-full bg-background-secondary overflow-hidden" role="presentation">
      <div
        className={`h-full rounded-full transition-all duration-500 ${fillBg.replace('bg-', 'bg-').replace('/30', '')}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

const RUBRIC_LABELS: Record<keyof RubricBreakdown, string> = {
  development: 'Development',
  organization: 'Organization',
  language_use: 'Language Use',
  vocabulary: 'Vocabulary',
}

export function ScoreCard({ overallScore, rubricBreakdown }: ScoreCardProps) {
  const { bg, text, ring } = scoreColorClasses(overallScore)

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Overall score badge */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className={`
              flex h-24 w-24 items-center justify-center rounded-full
              ring-4 ${ring} ${bg}
            `}
            aria-label={`Overall score: ${overallScore} out of 5`}
          >
            <span className={`text-4xl font-bold tabular-nums ${text}`}>{overallScore}</span>
          </div>
          <span className="text-xs text-foreground-muted font-medium">out of 5</span>
        </div>

        {/* Rubric sub-scores */}
        <div className="flex-1 space-y-3">
          {(Object.keys(RUBRIC_LABELS) as Array<keyof RubricBreakdown>).map((key) => {
            const sub = rubricBreakdown[key]
            const { text: subText } = scoreColorClasses(sub)
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{RUBRIC_LABELS[key]}</span>
                  <span className={`text-sm font-semibold tabular-nums ${subText}`}>
                    {sub} / 5
                  </span>
                </div>
                <ScoreBar score={sub} />
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
