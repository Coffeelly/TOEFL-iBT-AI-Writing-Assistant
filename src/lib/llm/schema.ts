// =============================================================================
// LLM Response Validation Schema
// =============================================================================
// Zod schema for validating LLM feedback JSON, plus typed error hierarchy.
// Requirements: 8.2, 8.3, 14.1, 14.2, 14.3, 14.4, 14.5
// =============================================================================

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Typed error hierarchy
// ---------------------------------------------------------------------------

export class LlmError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'LlmError'
  }
}

export class OllamaConnectionError extends LlmError {
  constructor(message = 'Could not connect to Ollama', options?: ErrorOptions) {
    super(message, options)
    this.name = 'OllamaConnectionError'
  }
}

export class GeminiAuthError extends LlmError {
  constructor(message = 'Gemini API authentication failed', options?: ErrorOptions) {
    super(message, options)
    this.name = 'GeminiAuthError'
  }
}

export class GeminiRateLimitError extends LlmError {
  constructor(message = 'Gemini API rate limit exceeded', options?: ErrorOptions) {
    super(message, options)
    this.name = 'GeminiRateLimitError'
  }
}

export class LlmParseError extends LlmError {
  constructor(
    public raw: string,
    options?: ErrorOptions,
  ) {
    super('Failed to parse LLM response', options)
    this.name = 'LlmParseError'
  }
}

// ---------------------------------------------------------------------------
// Feedback schema
// ---------------------------------------------------------------------------

export const feedbackSchema = z.object({
  overall_score: z.number().min(0).max(5),
  rubric_breakdown: z.object({
    development: z.number().min(0).max(5),
    organization: z.number().min(0).max(5),
    language_use: z.number().min(0).max(5),
    vocabulary: z.number().min(0).max(5),
  }),
  grammar_corrections: z.array(
    z.object({
      original: z.string(),
      corrected: z.string(),
      explanation: z.string(),
    }),
  ),
  vocabulary_suggestions: z.array(
    z.object({
      original: z.string(),
      suggested: z.string(),
      reason: z.string(),
    }),
  ),
  coherence_analysis: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  polished_version: z.string(),
})

export type FeedbackResponse = z.infer<typeof feedbackSchema>

// ---------------------------------------------------------------------------
// parseLlmResponse
// ---------------------------------------------------------------------------

/**
 * Extracts a JSON block from a raw LLM string, parses it, and validates it
 * against feedbackSchema. Throws LlmParseError on any failure.
 */
export function parseLlmResponse(raw: string): FeedbackResponse {
  // Try to extract a JSON block (```json ... ``` or bare {...})
  let jsonStr: string

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    jsonStr = fenced[1].trim()
  } else {
    // Find the first { ... } block
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new LlmParseError(raw, { cause: new Error('No JSON object found in response') })
    }
    jsonStr = raw.slice(start, end + 1)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (err) {
    throw new LlmParseError(raw, { cause: err })
  }

  const result = feedbackSchema.safeParse(parsed)
  if (!result.success) {
    throw new LlmParseError(raw, { cause: result.error })
  }

  return result.data
}
