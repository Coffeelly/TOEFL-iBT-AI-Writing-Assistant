// =============================================================================
// Ollama LLM Client
// =============================================================================
// Handles communication with a local Ollama instance.
// All calls are made from the browser — never proxied through the backend.
// Requirements: 8.1, 8.6, 8.7
// =============================================================================

import { OLLAMA_MODEL } from '@/lib/constants'
import { OllamaConnectionError } from './schema'

export interface LlmClient {
  evaluate(systemPrompt: string, userContent: string): Promise<string>
}

interface OllamaGenerateRequest {
  model: string
  system: string
  prompt: string
  stream: false
}

interface OllamaGenerateResponse {
  response: string
  done: boolean
}

export class OllamaClient implements LlmClient {
  constructor(private readonly endpoint: string) {}

  /**
   * Sends an empty prompt to Ollama to pre-load the model into memory.
   * Ollama interprets an empty prompt as a load-only request and returns
   * immediately once the model is resident — no tokens are generated.
   * Call this as early as possible (e.g. when the practice page mounts)
   * so the model is warm by the time the user submits their essay.
   * Errors are silently swallowed — warm-up is best-effort.
   */
  async warmUp(): Promise<void> {
    const url = `${this.endpoint.replace(/\/$/, '')}/api/generate`
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Empty prompt = load model, generate nothing
        body: JSON.stringify({ model: OLLAMA_MODEL, prompt: '', keep_alive: '10m' }),
      })
    } catch {
      // Best-effort — ignore errors so the UI is never blocked
    }
  }

  async evaluate(systemPrompt: string, userContent: string): Promise<string> {
    const url = `${this.endpoint.replace(/\/$/, '')}/api/generate`

    const body: OllamaGenerateRequest = {
      model: OLLAMA_MODEL,
      system: systemPrompt,
      prompt: userContent,
      stream: false,
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new OllamaConnectionError(
        `Could not connect to Ollama at ${this.endpoint}. Is it running?`,
        { cause: err },
      )
    }

    if (!response.ok) {
      throw new OllamaConnectionError(
        `Ollama returned HTTP ${response.status} from ${url}`,
      )
    }

    const data = (await response.json()) as OllamaGenerateResponse
    return data.response
  }
}
