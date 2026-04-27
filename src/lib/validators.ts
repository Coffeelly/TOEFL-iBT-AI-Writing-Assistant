// =============================================================================
// Input Validation Schemas (Zod)
// =============================================================================
// Centralized validation schemas for API request bodies and query parameters.
// Requirements: 15.1, 15.2, 15.3
// =============================================================================

import { z, ZodSchema } from 'zod'
import { DifficultyLevel, WritingMode } from '@/types'

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// ---------------------------------------------------------------------------
// Submission schemas
// ---------------------------------------------------------------------------

const rubricScoresSchema = z.object({
  development: z.number().min(0).max(5),
  organization: z.number().min(0).max(5),
  language_use: z.number().min(0).max(5),
  vocabulary: z.number().min(0).max(5),
})

export const createSubmissionSchema = z.object({
  promptId: z.string().min(1, 'promptId is required'),
  essayText: z.string().min(1, 'essayText is required'),
  wordCount: z.number().int().min(0),
  timeSpentSec: z.number().int().min(0),
  overallScore: z.number().min(0).max(5),
  rubricScores: rubricScoresSchema,
  feedbackJson: z.record(z.unknown()),
  polishedVersion: z.string(),
  llmProvider: z.enum(['OLLAMA', 'GEMINI']),
})

export const submissionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  mode: z.nativeEnum(WritingMode).optional(),
  minScore: z.coerce.number().min(0).max(5).optional(),
  maxScore: z.coerce.number().min(0).max(5).optional(),
})

// ---------------------------------------------------------------------------
// Prompt schemas
// ---------------------------------------------------------------------------

export const promptsQuerySchema = z.object({
  mode: z.nativeEnum(WritingMode),
  difficulty: z.union([z.nativeEnum(DifficultyLevel), z.literal('auto')]).optional(),
})

// ---------------------------------------------------------------------------
// Settings schema
// ---------------------------------------------------------------------------

export const updateSettingsSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  currentLevel: z.nativeEnum(DifficultyLevel).optional(),
})

// ---------------------------------------------------------------------------
// Validate helper
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  constructor(public details: z.ZodIssue[]) {
    super('Validation error')
    this.name = 'ValidationError'
  }
}

/**
 * Validates data against a Zod schema.
 * Returns { data } on success, throws ValidationError with field-level messages on failure.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): { data: T } {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(result.error.issues)
  }
  return { data: result.data }
}
