// =============================================================================
// Feedback Response Types
// =============================================================================
// Matches the AI evaluation JSON schema defined in spec §3.2.1.
// Used for both LLM response validation and UI rendering.
// =============================================================================

export interface GrammarCorrection {
  original: string
  corrected: string
  explanation: string
}

export interface VocabSuggestion {
  original: string
  suggested: string
  reason: string
}

export interface RubricBreakdown {
  development: number
  organization: number
  language_use: number
  vocabulary: number
}

export interface FeedbackResponse {
  overall_score: number
  rubric_breakdown: RubricBreakdown
  grammar_corrections: GrammarCorrection[]
  vocabulary_suggestions: VocabSuggestion[]
  coherence_analysis: string
  strengths: string[]
  improvements: string[]
  polished_version: string
}
