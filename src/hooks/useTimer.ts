// =============================================================================
// useTimer Hook
// =============================================================================
// Countdown timer for writing practice sessions.
// Requirements: 6.2, 6.3, 6.4, 6.5
// =============================================================================

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TIMER_WARNING_THRESHOLD_SECONDS } from '@/lib/constants'

export interface UseTimerReturn {
  secondsLeft: number
  /** True when secondsLeft ≤ TIMER_WARNING_THRESHOLD_SECONDS (120 s) */
  isWarning: boolean
  /** True when the countdown has reached 0 */
  isExpired: boolean
  start(): void
  reset(): void
}

/**
 * Countdown timer hook.
 *
 * @param durationSeconds - Total duration in seconds (e.g. 420 for EMAIL, 600 for DISCUSSION)
 */
export function useTimer(durationSeconds: number): UseTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer()
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [isRunning, clearTimer])

  // Clean up on unmount
  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    setIsRunning(false)
    setSecondsLeft(durationSeconds)
  }, [clearTimer, durationSeconds])

  return {
    secondsLeft,
    isWarning: secondsLeft <= TIMER_WARNING_THRESHOLD_SECONDS,
    isExpired: secondsLeft === 0,
    start,
    reset,
  }
}
