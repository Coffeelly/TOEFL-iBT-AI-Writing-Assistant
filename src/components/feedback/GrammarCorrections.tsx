// =============================================================================
// GrammarCorrections Component
// =============================================================================
// Renders a list of grammar corrections with the original text shown as
// strikethrough, the corrected text, and an explanation.
// Requirements: 10.3
// =============================================================================

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { GrammarCorrection } from '@/types/feedback'

interface GrammarCorrectionsProps {
  corrections: GrammarCorrection[]
}

export function GrammarCorrections({ corrections }: GrammarCorrectionsProps) {
  if (corrections.length === 0) {
    return (
      <Card title="Grammar Corrections">
        <p className="text-sm text-foreground-muted italic">
          No grammar corrections — great work!
        </p>
      </Card>
    )
  }

  return (
    <Card
      title="Grammar Corrections"
      footer={
        <p className="text-xs text-foreground-muted">
          {corrections.length} correction{corrections.length !== 1 ? 's' : ''} found
        </p>
      }
    >
      <ol className="space-y-4" aria-label="Grammar corrections list">
        {corrections.map((item, idx) => (
          <li key={idx} className="flex gap-3">
            <Badge variant="error" size="sm" className="mt-0.5 shrink-0 tabular-nums">
              {idx + 1}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
                {/* Original — strikethrough */}
                <span
                  className="line-through text-foreground-muted text-sm"
                  aria-label="Original text"
                >
                  {item.original}
                </span>
                <span className="text-foreground-muted text-sm" aria-hidden="true">→</span>
                {/* Corrected */}
                <span
                  className="text-emerald-700 dark:text-emerald-300 font-medium text-sm"
                  aria-label="Corrected text"
                >
                  {item.corrected}
                </span>
              </div>
              {/* Explanation */}
              <p className="text-sm text-foreground-muted leading-relaxed">
                {item.explanation}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
