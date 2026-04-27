'use client'

// =============================================================================
// useLlmEvaluation Hook
// =============================================================================
// Manages client-side LLM evaluation calls (Ollama / Gemini).
// Reads LlmConfig from localStorage, builds the evaluation prompt, calls the
// appropriate LLM client, validates the response, and retries on parse errors.
// Requirements: 8.3, 8.4, 8.5, 8.6
// =============================================================================

import { useState, useCallback } from 'react'
import { STORAGE_KEYS, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/constants'
import { getLlmClient } from '@/lib/llm/client'
import { buildEvaluationPrompt } from '@/lib/llm/prompts'
import { parseLlmResponse, LlmParseError } from '@/lib/llm/schema'
import type { LlmConfig, WritingMode } from '@/types'
import type { FeedbackResponse } from '@/types/feedback'
import type { Prompt } from '@/types/prompt'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of additional retry attempts after the first failure */
const MAX_RETRIES = 2

/** Default config used when nothing is stored in localStorage */
const DEFAULT_LLM_CONFIG: LlmConfig = {
  provider: 'OLLAMA',
  ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT,
  geminiApiKey: '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG)
    if (!raw) return DEFAULT_LLM_CONFIG
    const parsed = JSON.parse(raw) as Partial<LlmConfig>
    return {
      provider: parsed.provider ?? DEFAULT_LLM_CONFIG.provider,
      ollamaEndpoint: parsed.ollamaEndpoint ?? DEFAULT_OLLAMA_ENDPOINT,
      geminiApiKey: parsed.geminiApiKey ?? '',
    }
  } catch {
    return DEFAULT_LLM_CONFIG
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred during evaluation'
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseLlmEvaluationReturn {
  evaluate: (essay: string, prompt: Prompt, mode: WritingMode) => Promise<FeedbackResponse>
  isLoading: boolean
  error: string | null
}

export function useLlmEvaluation(): UseLlmEvaluationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const evaluate = useCallback(
    async (essay: string, prompt: Prompt, mode: WritingMode): Promise<FeedbackResponse> => {
      setIsLoading(true)
      setError(null)

      try {
        const config = readLlmConfig()
        const client = getLlmClient(config)
        const { systemPrompt, userContent } = buildEvaluationPrompt(mode, prompt, essay)

        let lastError: unknown = null

        // First attempt + up to MAX_RETRIES additional attempts on LlmParseError
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const raw = await client.evaluate(systemPrompt, userContent)
            const feedback = parseLlmResponse(raw)
            return feedback
          } catch (err) {
            lastError = err
            // Only retry on parse errors; propagate connection/auth errors immediately
            if (!(err instanceof LlmParseError)) {
              throw err
            }
            // If this was the last attempt, fall through to throw below
          }
        }

        // All retries exhausted — surface the last parse error
        throw lastError
      } catch (err) {
        const message = getErrorMessage(err)
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return { evaluate, isLoading, error }
}
