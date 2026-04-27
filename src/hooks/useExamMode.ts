'use client'

// =============================================================================
// useExamMode Hook
// =============================================================================
// Manages the exclusive exam session:
//   - Enters fullscreen on start
//   - Blocks browser navigation (beforeunload, popstate)
//   - Detects fullscreen exit and starts a countdown before auto-submitting
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'

export type ExamPhase =
  | 'pre'          // Confirmation modal shown, test not started
  | 'active'       // Test in progress, fullscreen
  | 'exit-warning' // User exited fullscreen, countdown running
  | 'done'         // Test submitted, locks released

const FULLSCREEN_RETURN_SECONDS = 10

interface UseExamModeOptions {
  onAutoSubmit: () => void  // Called when countdown reaches 0
}

interface UseExamModeReturn {
  phase: ExamPhase
  exitCountdown: number     // Seconds remaining to return to fullscreen
  startExam: () => void     // Call from "Start Test" button (needs user gesture)
  endExam: () => void       // Call after submission completes
  returnToFullscreen: () => void
}

export function useExamMode({ onAutoSubmit }: UseExamModeOptions): UseExamModeReturn {
  const [phase, setPhase] = useState<ExamPhase>('pre')
  const [exitCountdown, setExitCountdown] = useState(FULLSCREEN_RETURN_SECONDS)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<ExamPhase>('pre')

  // Keep ref in sync so event handlers always see current phase
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // ---------------------------------------------------------------------------
  // Fullscreen helpers
  // ---------------------------------------------------------------------------

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    } catch {
      // Fullscreen may be denied (e.g. in iframes) — continue without it
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // Ignore
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Countdown management
  // ---------------------------------------------------------------------------

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const startCountdown = useCallback(() => {
    clearCountdown()
    setExitCountdown(FULLSCREEN_RETURN_SECONDS)

    countdownRef.current = setInterval(() => {
      setExitCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown()
          // Auto-submit
          setPhase('done')
          onAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearCountdown, onAutoSubmit])

  // ---------------------------------------------------------------------------
  // Fullscreen change listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function handleFullscreenChange() {
      if (phaseRef.current !== 'active') return

      if (!document.fullscreenElement) {
        // User exited fullscreen (pressed Escape or used browser controls)
        setPhase('exit-warning')
        startCountdown()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [startCountdown])

  // ---------------------------------------------------------------------------
  // Navigation blocking
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (phase !== 'active' && phase !== 'exit-warning') return

    // Block tab close / refresh
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    // Block browser back/forward
    function handlePopState() {
      // Push a new state to cancel the navigation
      window.history.pushState(null, '', window.location.href)
    }

    // Push a dummy state so the first back-button press is intercepted
    window.history.pushState(null, '', window.location.href)

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [phase])

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearCountdown()
      void exitFullscreen()
    }
  }, [clearCountdown, exitFullscreen])

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const startExam = useCallback(async () => {
    await enterFullscreen()
    setPhase('active')
  }, [enterFullscreen])

  const endExam = useCallback(async () => {
    clearCountdown()
    setPhase('done')
    await exitFullscreen()
  }, [clearCountdown, exitFullscreen])

  const returnToFullscreen = useCallback(async () => {
    clearCountdown()
    setExitCountdown(FULLSCREEN_RETURN_SECONDS)
    await enterFullscreen()
    setPhase('active')
  }, [clearCountdown, enterFullscreen])

  return { phase, exitCountdown, startExam, endExam, returnToFullscreen }
}
