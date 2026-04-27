// =============================================================================
// useWordCount Hook
// =============================================================================
// Live word count tracking for the writing editor.
// Requirements: 6.6
// =============================================================================

'use client'

import { useMemo } from 'react'
import { WORD_COUNT_TARGETS } from '@/lib/constants'
import type { WritingMode } from '@/types'

/**
 * Counts the number of whitespace-delimited tokens in a string.
 * Empty string and all-whitespace strings return 0.
 * Exported as a standalone function for property testing.
 */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '') return 0
  return trimmed.split(/\s+/).length
}

export interface UseWordCountReturn {
  wordCount: number
  /** True when wordCount meets the minimum target for the given mode */
  meetsMinimum: boolean
}

/**
 * Returns the live word count for the given text and whether it meets
 * the minimum word count target for the specified writing mode.
 */
export function useWordCount(text: string, mode: WritingMode): UseWordCountReturn {
  const wordCount = useMemo(() => countWords(text), [text])
  const meetsMinimum = wordCount >= WORD_COUNT_TARGETS[mode].min

  return { wordCount, meetsMinimum }
}
