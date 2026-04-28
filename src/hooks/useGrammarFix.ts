'use client'

// =============================================================================
// useGrammarFix Hook
// =============================================================================
// Provides realtime grammar correction by debouncing user input and calling
// the configured LLM (Ollama or Gemini) directly from the browser.
// Returns the corrected text, loading state, and any error message.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { STORAGE_KEYS, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/constants'
import { getLlmClient } from '@/lib/llm/client'
import { OllamaClient } from '@/lib/llm/ollama'
import type { LlmConfig } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Milliseconds to wait after the user stops typing before calling the LLM */
const DEBOUNCE_MS = 900

/** Minimum characters before triggering a correction request */
const MIN_INPUT_LENGTH = 10

const DEFAULT_LLM_CONFIG: LlmConfig = {
  provider: 'OLLAMA',
  ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT,
  geminiApiKey: '',
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const GRAMMAR_FIX_SYSTEM_PROMPT = `You are a precise English grammar and writing corrector.

Your task:
- Fix ALL grammar, spelling, punctuation, and sentence structure errors in the user's text.
- Improve awkward phrasing and word choice for clarity and naturalness.
- Preserve the user's original meaning, tone, and ideas exactly — do NOT add new content or change the message.
- If the text is already correct and natural, return it exactly as-is without any changes.

Rules:
- Respond with ONLY the corrected text. No explanations, no labels, no markdown, no quotes.
- Do not add any prefix like "Corrected:" or "Here is the fixed version:".
- Output plain text only.`

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseGrammarFixReturn {
  correctedText: string
  isLoading: boolean
  error: string | null
  /** Call this to manually re-trigger correction for the current input */
  retry: () => void
}

export function useGrammarFix(inputText: string): UseGrammarFixReturn {
  const [correctedText, setCorrectedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fire-and-forget warm-up on mount so Ollama has the model loaded
  // before the user finishes typing their first sentence.
  useEffect(() => {
    const config = readLlmConfig()
    if (config.provider === 'OLLAMA') {
      const client = getLlmClient(config)
      if (client instanceof OllamaClient) {
        void client.warmUp()
      }
    }
  }, [])

  // Keep a ref to the latest input so the async callback can check for staleness
  const latestInputRef = useRef(inputText)
  latestInputRef.current = inputText

  // Stable ref to the correction function so retry can call it
  const correctRef = useRef<(text: string) => void>(() => {})

  const correct = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < MIN_INPUT_LENGTH) {
      setCorrectedText('')
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const config = readLlmConfig()
      const client = getLlmClient(config)
      const result = await client.evaluate(GRAMMAR_FIX_SYSTEM_PROMPT, text)

      // Discard stale responses if the input changed while we were waiting
      if (latestInputRef.current !== text) return

      setCorrectedText(result.trim())
    } catch (err) {
      if (latestInputRef.current !== text) return
      const message = err instanceof Error ? err.message : 'Correction failed'
      setError(message)
      setCorrectedText('')
    } finally {
      if (latestInputRef.current === text) {
        setIsLoading(false)
      }
    }
  }, [])

  correctRef.current = correct

  // Debounced effect: fires correction DEBOUNCE_MS after the user stops typing
  useEffect(() => {
    if (!inputText.trim() || inputText.trim().length < MIN_INPUT_LENGTH) {
      setCorrectedText('')
      setError(null)
      setIsLoading(false)
      return
    }

    // Show loading immediately so the user knows something is happening
    setIsLoading(true)

    const timer = setTimeout(() => {
      correctRef.current(inputText)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [inputText])

  const retry = useCallback(() => {
    correctRef.current(latestInputRef.current)
  }, [])

  return { correctedText, isLoading, error, retry }
}
