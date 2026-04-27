// =============================================================================
// Shared Types
// =============================================================================
// Central type definitions used across the application.
// Re-exports domain-specific types for convenience.
// =============================================================================

export const WritingMode = {
  EMAIL: 'EMAIL',
  DISCUSSION: 'DISCUSSION',
} as const

export type WritingMode = (typeof WritingMode)[keyof typeof WritingMode]

export const DifficultyLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const

export type DifficultyLevel = (typeof DifficultyLevel)[keyof typeof DifficultyLevel]

export const LlmProvider = {
  OLLAMA: 'OLLAMA',
  GEMINI: 'GEMINI',
} as const

export type LlmProvider = (typeof LlmProvider)[keyof typeof LlmProvider]

export interface UserProfile {
  id: string
  email: string
  displayName: string
  currentLevel: DifficultyLevel
  createdAt: Date
  updatedAt: Date
}

export interface LlmConfig {
  provider: LlmProvider
  ollamaEndpoint: string
  geminiApiKey: string
}

// Re-export domain types
export type { FeedbackResponse, RubricBreakdown, GrammarCorrection, VocabSuggestion } from './feedback'
export type { Prompt, EmailPrompt, AcademicDiscussionPrompt } from './prompt'
