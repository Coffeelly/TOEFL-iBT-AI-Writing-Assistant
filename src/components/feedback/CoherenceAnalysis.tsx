// =============================================================================
// CoherenceAnalysis Component
// =============================================================================
// Displays the AI's coherence and cohesion analysis as a text block.
// Requirements: 10.1
// =============================================================================

import { Card } from '@/components/ui/Card'

interface CoherenceAnalysisProps {
  analysis: string
}

export function CoherenceAnalysis({ analysis }: CoherenceAnalysisProps) {
  return (
    <Card title="Coherence & Cohesion">
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {analysis || <span className="italic text-foreground-muted">No analysis provided.</span>}
      </p>
    </Card>
  )
}
