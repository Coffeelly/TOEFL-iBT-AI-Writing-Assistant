// =============================================================================
// VocabSuggestions Component
// =============================================================================
// Renders a list of vocabulary improvement suggestions: original word →
// suggested replacement + reason.
// Requirements: 10.3
// =============================================================================

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { VocabSuggestion } from '@/types/feedback'

interface VocabSuggestionsProps {
  suggestions: VocabSuggestion[]
}

export function VocabSuggestions({ suggestions }: VocabSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <Card title="Vocabulary Suggestions">
        <p className="text-sm text-foreground-muted italic">
          No vocabulary suggestions — excellent word choice!
        </p>
      </Card>
    )
  }

  return (
    <Card
      title="Vocabulary Suggestions"
      footer={
        <p className="text-xs text-foreground-muted">
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </p>
      }
    >
      <ol className="space-y-4" aria-label="Vocabulary suggestions list">
        {suggestions.map((item, idx) => (
          <li key={idx} className="flex gap-3">
            <Badge variant="warning" size="sm" className="mt-0.5 shrink-0 tabular-nums">
              {idx + 1}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
                {/* Original word */}
                <span
                  className="rounded bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-sm font-medium text-amber-800 dark:text-amber-200"
                  aria-label="Original word"
                >
                  {item.original}
                </span>
                <span className="text-foreground-muted text-sm" aria-hidden="true">→</span>
                {/* Suggested word */}
                <span
                  className="rounded bg-brand-100 dark:bg-brand-900/30 px-1.5 py-0.5 text-sm font-medium text-brand-700 dark:text-brand-300"
                  aria-label="Suggested word"
                >
                  {item.suggested}
                </span>
              </div>
              {/* Reason */}
              <p className="text-sm text-foreground-muted leading-relaxed">{item.reason}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
