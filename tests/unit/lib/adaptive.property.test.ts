// Feature: toefl-helper-local, Property 7: Adaptive difficulty level assignment
// Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateNextLevel } from '../../../src/lib/adaptive'
import { ADAPTIVE_DIFFICULTY } from '../../../src/lib/constants'

const { MIN_SUBMISSIONS_FOR_CHANGE, BEGINNER_THRESHOLD, ADVANCED_THRESHOLD } = ADAPTIVE_DIFFICULTY

describe('Property 7: Adaptive difficulty level assignment', () => {
  it('returns current level unchanged when fewer than MIN_SUBMISSIONS_FOR_CHANGE scores', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BEGINNER' as const, 'INTERMEDIATE' as const, 'ADVANCED' as const),
        fc.array(fc.float({ min: 0, max: 5 }), { maxLength: MIN_SUBMISSIONS_FOR_CHANGE - 1 }),
        (currentLevel, scores) => {
          const result = calculateNextLevel(currentLevel, scores)
          expect(result).toBe(currentLevel)
        },
      ),
      { numRuns: 200 },
    )
  })

  it('returns BEGINNER when mean of recent scores < BEGINNER_THRESHOLD', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BEGINNER' as const, 'INTERMEDIATE' as const, 'ADVANCED' as const),
        fc.array(fc.float({ min: 0, max: Math.fround(BEGINNER_THRESHOLD - 0.01), noNaN: true }), {
          minLength: MIN_SUBMISSIONS_FOR_CHANGE,
          maxLength: 10,
        }),
        (currentLevel, scores) => {
          const result = calculateNextLevel(currentLevel, scores)
          expect(result).toBe('BEGINNER')
        },
      ),
      { numRuns: 200 },
    )
  })

  it('returns ADVANCED when mean of recent scores > ADVANCED_THRESHOLD', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BEGINNER' as const, 'INTERMEDIATE' as const, 'ADVANCED' as const),
        fc.array(fc.float({ min: Math.fround(ADVANCED_THRESHOLD + 0.01), max: 5, noNaN: true }), {
          minLength: MIN_SUBMISSIONS_FOR_CHANGE,
          maxLength: 10,
        }),
        (currentLevel, scores) => {
          const result = calculateNextLevel(currentLevel, scores)
          expect(result).toBe('ADVANCED')
        },
      ),
      { numRuns: 200 },
    )
  })

  it('returns INTERMEDIATE when mean of recent scores is in [BEGINNER_THRESHOLD, ADVANCED_THRESHOLD]', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BEGINNER' as const, 'INTERMEDIATE' as const, 'ADVANCED' as const),
        fc.array(fc.float({ min: BEGINNER_THRESHOLD, max: ADVANCED_THRESHOLD, noNaN: true }), {
          minLength: MIN_SUBMISSIONS_FOR_CHANGE,
          maxLength: 10,
        }),
        (currentLevel, scores) => {
          const result = calculateNextLevel(currentLevel, scores)
          expect(result).toBe('INTERMEDIATE')
        },
      ),
      { numRuns: 200 },
    )
  })
})
