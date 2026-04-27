'use client'

// =============================================================================
// GeneratePromptButton
// =============================================================================
// Calls the LLM client-side to generate a new TOEFL prompt, saves it to the
// DB via POST /api/prompts/generate, then refreshes the page so it appears
// in the list.
// =============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { getLlmClient } from '@/lib/llm/client'
import {
  buildPromptGenerationRequest,
  parseGeneratedPrompt,
} from '@/lib/llm/promptGenerator'
import { STORAGE_KEYS, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/constants'
import type { WritingMode, DifficultyLevel, LlmConfig } from '@/types'

interface GeneratePromptButtonProps {
  mode: WritingMode
}

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
]

function readLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG)
    if (!raw) return { provider: 'OLLAMA', ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT, geminiApiKey: '' }
    return JSON.parse(raw) as LlmConfig
  } catch {
    return { provider: 'OLLAMA', ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT, geminiApiKey: '' }
  }
}

export function GeneratePromptButton({ mode }: GeneratePromptButtonProps) {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('BEGINNER')
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState<{
    isVisible: boolean
    message: string
    variant: 'success' | 'error' | 'info'
  }>({ isVisible: false, message: '', variant: 'info' })

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      // Step 1: call LLM client-side
      const config = readLlmConfig()
      const client = getLlmClient(config)
      const { systemPrompt, userContent } = buildPromptGenerationRequest(mode, difficulty)
      const raw = await client.evaluate(systemPrompt, userContent)

      // Step 2: parse and validate the response
      const generated = parseGeneratedPrompt(raw, mode)

      // Step 3: save to DB
      const res = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          difficulty,
          ...generated,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Server error (${res.status})`)
      }

      setToast({
        isVisible: true,
        message: 'New question generated and added to the list!',
        variant: 'success',
      })

      // Step 4: refresh the page so the new prompt appears
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate question. Please try again.'
      setToast({ isVisible: true, message, variant: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Difficulty selector */}
        <div className="flex rounded-lg border border-card-border overflow-hidden">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              disabled={isGenerating}
              className={`
                px-3 py-2 text-sm font-medium transition-colors cursor-pointer
                ${
                  difficulty === opt.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-card-bg text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <Button
          variant="outline"
          onClick={handleGenerate}
          isLoading={isGenerating}
          disabled={isGenerating}
        >
          {isGenerating ? (
            'Generating…'
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v3" />
                <path d="M18.5 5.5 16.4 7.6" />
                <path d="M21 12h-3" />
                <path d="M18.5 18.5 16.4 16.4" />
                <path d="M12 21v-3" />
                <path d="M5.5 18.5 7.6 16.4" />
                <path d="M3 12h3" />
                <path d="M5.5 5.5 7.6 7.6" />
              </svg>
              Generate New Question
            </>
          )}
        </Button>
      </div>

      <Toast
        message={toast.message}
        variant={toast.variant}
        isVisible={toast.isVisible}
        onClose={() => setToast((p) => ({ ...p, isVisible: false }))}
      />
    </>
  )
}
