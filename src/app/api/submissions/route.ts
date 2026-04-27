import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validate, createSubmissionSchema, submissionsQuerySchema, ValidationError } from '@/lib/validators'
import { calculateNextLevel } from '@/lib/adaptive'
import type { DifficultyLevel } from '@/types'

// =============================================================================
// POST /api/submissions
// =============================================================================
// Creates a new submission record. Auth is optional — guests submit with
// userId = null. For authenticated users, recalculates adaptive difficulty.
// Requirements: 9.1, 9.2, 9.3, 9.4, 11.7
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = validate(createSubmissionSchema, body)

    // Read optional user identity forwarded by middleware
    const userId = request.headers.get('x-user-id') ?? null

    // Persist the submission
    // feedbackJson is typed as Record<string, unknown> from Zod but Prisma
    // expects InputJsonValue — cast via unknown to satisfy the type checker.
    const submission = await prisma.submission.create({
      data: {
        promptId: data.promptId,
        essayText: data.essayText,
        wordCount: data.wordCount,
        timeSpentSec: data.timeSpentSec,
        overallScore: data.overallScore,
        rubricScores: data.rubricScores as unknown as object,
        feedbackJson: data.feedbackJson as unknown as object,
        polishedVersion: data.polishedVersion,
        llmProvider: data.llmProvider,
        userId,
      },
    })

    // For authenticated users: recalculate adaptive difficulty
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { currentLevel: true },
        })

        if (user) {
          // Fetch the last 5 overall scores (excluding the one just created,
          // then include it by fetching the 5 most recent)
          const recentSubmissions = await prisma.submission.findMany({
            where: { userId, overallScore: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { overallScore: true },
          })

          const recentScores = recentSubmissions
            .map((s) => s.overallScore)
            .filter((score): score is number => score !== null)

          const nextLevel = calculateNextLevel(
            user.currentLevel as DifficultyLevel,
            recentScores,
          )

          if (nextLevel !== user.currentLevel) {
            await prisma.user.update({
              where: { id: userId },
              data: { currentLevel: nextLevel },
            })
          }
        }
      } catch (adaptiveErr) {
        // Adaptive difficulty update is non-critical — log but don't fail the request
        console.error('[submissions] Adaptive difficulty update failed:', adaptiveErr)
      }
    }

    return NextResponse.json({ submissionId: submission.id }, { status: 201 })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.details },
        { status: 400 },
      )
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    console.error('[POST /api/submissions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =============================================================================
// GET /api/submissions
// =============================================================================
// Returns a paginated list of submissions for the authenticated user.
// Requirements: 9.5
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryRaw = Object.fromEntries(searchParams.entries())
    const { data: query } = validate(submissionsQuerySchema, queryRaw)

    const where = {
      userId,
      ...(query.mode ? { prompt: { mode: query.mode } } : {}),
      ...(query.minScore !== undefined || query.maxScore !== undefined
        ? {
            overallScore: {
              ...(query.minScore !== undefined ? { gte: query.minScore } : {}),
              ...(query.maxScore !== undefined ? { lte: query.maxScore } : {}),
            },
          }
        : {}),
    }

    const page = query.page ?? 1
    const limit = query.limit ?? 20

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { prompt: { select: { title: true, mode: true, difficulty: true } } },
      }),
      prisma.submission.count({ where }),
    ])

    const summaries = submissions.map((s) => ({
      id: s.id,
      mode: s.prompt.mode,
      difficulty: s.prompt.difficulty,
      promptTitle: s.prompt.title,
      overallScore: s.overallScore,
      wordCount: s.wordCount,
      timeSpentSec: s.timeSpentSec,
      llmProvider: s.llmProvider,
      createdAt: s.createdAt.toISOString(),
    }))

    return NextResponse.json({
      submissions: summaries,
      total,
      page,
      limit,
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.details },
        { status: 400 },
      )
    }
    console.error('[GET /api/submissions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
