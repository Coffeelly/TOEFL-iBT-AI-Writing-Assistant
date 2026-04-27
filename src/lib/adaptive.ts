// =============================================================================
// Adaptive Difficulty Logic
// =============================================================================
// Calculates the next difficulty level based on user's recent performance.
// Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
// =============================================================================

import type { DifficultyLevel } from '../generated/prisma/enums'
import { ADAPTIVE_DIFFICULTY } from './constants'

/**
 * Given a user's recent submission scores, compute the next difficulty level.
 *
 * - Returns `currentLevel` unchanged if fewer than MIN_SUBMISSIONS_FOR_CHANGE scores.
 * - Uses a sliding window of the last SLIDING_WINDOW_SIZE scores.
 * - avg < BEGINNER_THRESHOLD  → BEGINNER
 * - avg > ADVANCED_THRESHOLD  → ADVANCED
 * - otherwise                 → INTERMEDIATE
 */
export function calculateNextLevel(
  currentLevel: DifficultyLevel,
  recentScores: number[],
): DifficultyLevel {
  const { MIN_SUBMISSIONS_FOR_CHANGE, SLIDING_WINDOW_SIZE, BEGINNER_THRESHOLD, ADVANCED_THRESHOLD } =
    ADAPTIVE_DIFFICULTY

  if (recentScores.length < MIN_SUBMISSIONS_FOR_CHANGE) {
    return currentLevel
  }

  const window = recentScores.slice(-SLIDING_WINDOW_SIZE)
  const avg = window.reduce((sum, s) => sum + s, 0) / window.length

  if (avg < BEGINNER_THRESHOLD) return 'BEGINNER'
  if (avg > ADVANCED_THRESHOLD) return 'ADVANCED'
  return 'INTERMEDIATE'
}
