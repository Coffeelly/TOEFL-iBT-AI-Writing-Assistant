// =============================================================================
// POST /api/prompts/generate
// =============================================================================
// Generates a new TOEFL prompt using the LLM and saves it to the database.
// Client-side only — the LLM call happens in the browser, this route just
// persists the result.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { validate, ValidationError } from '@/lib/validators'
import type { WritingMode, DifficultyLevel } from '@/types'

const createGeneratedPromptSchema = z.object({
  mode: z.enum(['EMAIL', 'DISCUSSION']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  title: z.string().min(3),
  scenarioText: z.string().min(20),
  professorPrompt: z.string().optional(),
  studentOpinionA: z.string().optional(),
  studentOpinionB: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = validate(createGeneratedPromptSchema, body)

    const prompt = await prisma.prompt.create({
      data: {
        mode: data.mode as WritingMode,
        difficulty: data.difficulty as DifficultyLevel,
        title: data.title,
        scenarioText: data.scenarioText,
        professorPrompt: data.professorPrompt ?? null,
        studentOpinionA: data.studentOpinionA ?? null,
        studentOpinionB: data.studentOpinionB ?? null,
      },
    })

    return NextResponse.json({ promptId: prompt.id }, { status: 201 })
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
    console.error('[POST /api/prompts/generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
