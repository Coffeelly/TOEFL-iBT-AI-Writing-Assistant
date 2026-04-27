// =============================================================================
// GET /api/prompts
// =============================================================================
// Returns a randomly selected prompt matching the requested mode and difficulty.
// Supports `difficulty=auto` for authenticated users — delegates to the
// adaptive difficulty engine.
// Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validate, ValidationError, promptsQuerySchema } from '@/lib/validators'
import { calculateNextLevel } from '@/lib/adaptive'
import { ADAPTIVE_DIFFICULTY } from '@/lib/constants'
import type { DifficultyLevel } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const rawParams = {
      mode: searchParams.get('mode') ?? undefined,
      difficulty: searchParams.get('difficulty') ?? undefined,
    }

    const { data: query } = validate(promptsQuerySchema, rawParams)

    let difficulty: DifficultyLevel | undefined

    if (query.difficulty === 'auto') {
      // Authenticated users get adaptive difficulty; guests default to BEGINNER
      const userId = request.headers.get('x-user-id')

      if (userId) {
        const recentSubmissions = await prisma.submission.findMany({
          where: { userId, overallScore: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: ADAPTIVE_DIFFICULTY.SLIDING_WINDOW_SIZE,
          select: { overallScore: true },
        })

        const recentScores = recentSubmissions
          .map((s) => s.overallScore)
          .filter((score): score is number => score !== null)

        if (recentScores.length < ADAPTIVE_DIFFICULTY.MIN_SUBMISSIONS_FOR_CHANGE) {
          difficulty = 'BEGINNER'
        } else {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { currentLevel: true },
          })
          const currentLevel = (user?.currentLevel ?? 'BEGINNER') as DifficultyLevel
          difficulty = calculateNextLevel(currentLevel, recentScores)
        }
      } else {
        // Guest with auto difficulty → default to BEGINNER
        difficulty = 'BEGINNER'
      }
    } else if (query.difficulty) {
      difficulty = query.difficulty as DifficultyLevel
    }

    const prompts = await prisma.prompt.findMany({
      where: {
        mode: query.mode,
        ...(difficulty ? { difficulty } : {}),
      },
    })

    if (prompts.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const prompt = prompts[Math.floor(Math.random() * prompts.length)]

    return NextResponse.json({ prompt })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation error', details: err.details }, { status: 400 })
    }
    console.error('[GET /api/prompts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
