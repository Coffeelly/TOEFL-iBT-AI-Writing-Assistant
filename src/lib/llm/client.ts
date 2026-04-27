// =============================================================================
// LLM Client Factory
// =============================================================================
// Returns the correct LLM client (Ollama or Gemini) based on user config.
// Requirements: 8.1, 8.2
// =============================================================================

import type { LlmConfig } from '@/types'
import { DEFAULT_OLLAMA_ENDPOINT } from '@/lib/constants'
import { OllamaClient, type LlmClient } from './ollama'
import { GeminiClient } from './gemini'

export type { LlmClient }

/**
 * Factory that returns the appropriate LLM client based on the stored config.
 * Falls back to Ollama with the default endpoint if config is incomplete.
 */
export function getLlmClient(config: LlmConfig): LlmClient {
  if (config.provider === 'GEMINI') {
    return new GeminiClient(config.geminiApiKey)
  }
  // Default: Ollama
  return new OllamaClient(config.ollamaEndpoint || DEFAULT_OLLAMA_ENDPOINT)
}
