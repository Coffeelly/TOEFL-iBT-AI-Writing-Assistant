// =============================================================================
// Gemini LLM Client
// =============================================================================
// Handles communication with the Google Gemini API using a user-supplied key.
// The API key is read from localStorage and included only in direct browser
// requests to Google — it NEVER touches the app's own backend routes.
// Requirements: 8.1, 8.6, 8.8
// =============================================================================

import { GeminiAuthError, GeminiRateLimitError, LlmError } from './schema'
import type { LlmClient } from './ollama'

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GeminiPart {
  text: string
}

interface GeminiContent {
  parts: GeminiPart[]
  role?: string
}

interface GeminiRequestBody {
  contents: GeminiContent[]
  systemInstruction: {
    parts: GeminiPart[]
  }
}

interface GeminiResponseBody {
  candidates: Array<{
    content: {
      parts: GeminiPart[]
    }
  }>
}

export class GeminiClient implements LlmClient {
  constructor(private readonly apiKey: string) {}

  async evaluate(systemPrompt: string, userContent: string): Promise<string> {
    const body: GeminiRequestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userContent }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
    }

    let response: Response
    try {
      response = await fetch(GEMINI_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new LlmError(`Network error contacting Gemini API`, { cause: err })
    }

    if (response.status === 401 || response.status === 403) {
      throw new GeminiAuthError(
        `Gemini API key is invalid or lacks permission (HTTP ${response.status})`,
      )
    }

    if (response.status === 429) {
      throw new GeminiRateLimitError(
        'Gemini API rate limit exceeded. Please wait before retrying.',
      )
    }

    if (!response.ok) {
      throw new LlmError(`Gemini API returned HTTP ${response.status}`)
    }

    const data = (await response.json()) as GeminiResponseBody
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (typeof text !== 'string') {
      throw new LlmError('Gemini API returned an unexpected response shape')
    }

    return text
  }
}
