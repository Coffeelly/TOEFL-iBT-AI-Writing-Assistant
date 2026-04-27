// =============================================================================
// StrengthsImprovements Component
// =============================================================================
// Two-column layout showing the essay's strengths and areas for improvement.
// Requirements: 10.1
// =============================================================================

import { Card } from '@/components/ui/Card'

interface StrengthsImprovementsProps {
  strengths: string[]
  improvements: string[]
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function StrengthsImprovements({ strengths, improvements }: StrengthsImprovementsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Strengths */}
      <Card title="Strengths">
        {strengths.length === 0 ? (
          <p className="text-sm text-foreground-muted italic">No strengths listed.</p>
        ) : (
          <ul className="space-y-2" aria-label="Essay strengths">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Areas for improvement */}
      <Card title="Areas for Improvement">
        {improvements.length === 0 ? (
          <p className="text-sm text-foreground-muted italic">No improvements listed.</p>
        ) : (
          <ul className="space-y-2" aria-label="Areas for improvement">
            {improvements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ArrowIcon />
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
