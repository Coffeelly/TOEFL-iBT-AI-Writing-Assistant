'use client'

// =============================================================================
// Settings Page
// =============================================================================
// Allows users to configure LLM provider and difficulty override.
// Requirements: 7.7, 7.8
// =============================================================================

import { useState, useEffect } from 'react'
import { LlmConfigPanel } from '@/components/settings/LlmConfigPanel'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { STORAGE_KEYS } from '@/lib/constants'
import type { DifficultyLevel } from '@/types'

type DifficultyOption = DifficultyLevel | 'auto'

interface ToastState {
  isVisible: boolean
  message: string
  variant: 'success' | 'error' | 'info'
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  // Initialize directly from localStorage so the save effect never runs
  // with the wrong default and overwrites the stored value.
  const [difficultyOverride, setDifficultyOverride] = useState<DifficultyOption>(() => {
    if (typeof window === 'undefined') return 'auto'
    return (localStorage.getItem(STORAGE_KEYS.DIFFICULTY_OVERRIDE) as DifficultyOption) ?? 'auto'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    variant: 'info',
  })

  // Load user display name when auth resolves
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName)
    }
  }, [user])

  // Save difficulty override to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIFFICULTY_OVERRIDE, difficultyOverride)
  }, [difficultyOverride])

  async function handleSaveProfile() {
    if (!user) return

    setIsSaving(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      if (!token) {
        throw new Error('Not authenticated')
      }

      const res = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName !== user.displayName ? displayName : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to save settings')
      }

      setToast({
        isVisible: true,
        message: 'Profile settings saved successfully!',
        variant: 'success',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings'
      setToast({
        isVisible: true,
        message,
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function closeToast() {
    setToast((prev) => ({ ...prev, isVisible: false }))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Manage your account preferences and LLM configuration
        </p>
      </div>

      <div className="space-y-6">
        {/* LLM Configuration */}
        <LlmConfigPanel />

        {/* Profile Settings (authenticated users only) */}
        {user && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Profile Settings
            </h2>
            <div className="space-y-4">
              <Input
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
              <Button
                onClick={handleSaveProfile}
                isLoading={isSaving}
                disabled={!displayName || displayName === user.displayName}
              >
                Save Profile
              </Button>
            </div>
          </Card>
        )}

        {/* Difficulty Override */}
        {/* <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Difficulty Preference
          </h2>
          <p className="text-sm text-foreground-muted mb-4">
            {user
              ? 'Choose "Auto" to let the system adapt difficulty based on your recent performance, or manually select a level.'
              : 'Select your preferred difficulty level for practice prompts.'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['auto', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficultyOverride(level)}
                className={`
                  rounded-lg border px-4 py-3 text-sm font-medium transition-all focus-ring cursor-pointer
                  ${
                    difficultyOverride === level
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-card-border text-foreground-muted hover:border-brand-400 hover:text-foreground'
                  }
                `}
              >
                {level === 'auto' ? 'Auto' : level.charAt(0) + level.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {difficultyOverride === 'auto' && user && (
            <p className="mt-3 text-xs text-foreground-muted">
              Currently using adaptive difficulty based on your recent scores.
            </p>
          )}
        </Card> */}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        variant={toast.variant}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </div>
  )
}
