// =============================================================================
// Prompt Types
// =============================================================================
// Type definitions for writing prompts used in both Email and Academic
// Discussion modes.
// =============================================================================

import { DifficultyLevel, WritingMode } from './index'

export interface BasePrompt {
  id: string
  mode: WritingMode
  difficulty: DifficultyLevel
  title: string
  createdAt: Date
}

export interface EmailPrompt extends BasePrompt {
  mode: typeof WritingMode.EMAIL
  scenarioText: string
}

export interface AcademicDiscussionPrompt extends BasePrompt {
  mode: typeof WritingMode.DISCUSSION
  scenarioText: string
  professorPrompt: string
  studentOpinionA: string
  studentOpinionB: string
}

export type Prompt = EmailPrompt | AcademicDiscussionPrompt
