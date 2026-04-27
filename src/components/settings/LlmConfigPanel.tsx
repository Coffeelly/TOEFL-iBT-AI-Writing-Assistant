'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { Card } from '@/components/ui/Card'
import { DEFAULT_OLLAMA_ENDPOINT, STORAGE_KEYS } from '@/lib/constants'
import type { LlmConfig, LlmProvider } from '@/types'

interface ToastState {
  isVisible: boolean
  message: string
  variant: 'success' | 'error' | 'info'
}

export function LlmConfigPanel() {
  const [config, setConfig] = useState<LlmConfig>({
    provider: 'OLLAMA',
    ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT,
    geminiApiKey: '',
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    variant: 'info',
  })

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LlmConfig
        setConfig(parsed)
      } catch {
        // Invalid JSON, keep defaults
      }
    }
  }, [])

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LLM_CONFIG, JSON.stringify(config))
  }, [config])

  function handleProviderChange(provider: LlmProvider) {
    setConfig((prev) => ({ ...prev, provider }))
  }

  function handleOllamaEndpointChange(endpoint: string) {
    setConfig((prev) => ({ ...prev, ollamaEndpoint: endpoint }))
  }

  function handleGeminiApiKeyChange(apiKey: string) {
    setConfig((prev) => ({ ...prev, geminiApiKey: apiKey }))
  }

  async function testOllamaConnection() {
    setIsTestingConnection(true)
    try {
      // Use /api/tags (list models) instead of a full generate call —
      // it returns immediately without loading or running the model.
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5_000)

      const url = `${config.ollamaEndpoint.replace(/\/$/, '')}/api/tags`
      let response: Response
      try {
        response = await fetch(url, { signal: controller.signal })
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}`)
      }

      setToast({
        isVisible: true,
        message: 'Successfully connected to Ollama!',
        variant: 'success',
      })
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError'
      const message = isTimeout
        ? `Connection timed out — is Ollama running at ${config.ollamaEndpoint}?`
        : err instanceof Error
          ? err.message
          : 'Connection failed'
      setToast({
        isVisible: true,
        message,
        variant: 'error',
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  function closeToast() {
    setToast((prev) => ({ ...prev, isVisible: false }))
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          LLM Provider Configuration
        </h2>
        <p className="text-sm text-foreground-muted mb-6">
          Choose which AI provider evaluates your essays. Your API keys are stored locally and never sent to our servers.
        </p>

        {/* Provider Toggle */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Provider
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleProviderChange('OLLAMA')}
              className={`
                flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all focus-ring cursor-pointer
                ${
                  config.provider === 'OLLAMA'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-card-border text-foreground-muted hover:border-brand-400 hover:text-foreground'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">Ollama</span>
                <span className="text-xs opacity-75">Local LLM</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange('GEMINI')}
              className={`
                flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all focus-ring cursor-pointer
                ${
                  config.provider === 'GEMINI'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-card-border text-foreground-muted hover:border-brand-400 hover:text-foreground'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">Gemini</span>
                <span className="text-xs opacity-75">Google AI</span>
              </div>
            </button>
          </div>
        </div>

        {/* Ollama Configuration */}
        {config.provider === 'OLLAMA' && (
          <div className="space-y-4">
            <Input
              label="Ollama Endpoint"
              type="url"
              value={config.ollamaEndpoint}
              onChange={(e) => handleOllamaEndpointChange(e.target.value)}
              placeholder={DEFAULT_OLLAMA_ENDPOINT}
              hint="The URL where your Ollama instance is running"
            />
            <Button
              variant="outline"
              onClick={testOllamaConnection}
              isLoading={isTestingConnection}
              disabled={!config.ollamaEndpoint}
            >
              Test Connection
            </Button>
          </div>
        )}

        {/* Gemini Configuration */}
        {config.provider === 'GEMINI' && (
          <div className="space-y-4">
            <Input
              label="Gemini API Key"
              type="password"
              value={config.geminiApiKey}
              onChange={(e) => handleGeminiApiKeyChange(e.target.value)}
              placeholder="Enter your Gemini API key"
              hint="Get your API key from Google AI Studio"
            />
            <p className="text-xs text-foreground-muted">
              Your API key is stored locally in your browser and is never sent to our servers.
              It is only used to communicate directly with Google's Gemini API.
            </p>
          </div>
        )}
      </Card>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        variant={toast.variant}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </>
  )
}
