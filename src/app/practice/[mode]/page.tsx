// =============================================================================
// Practice Page (RSC)
// =============================================================================
// Fetches a prompt server-side and passes it to the PracticeShell client
// component. Validates the mode param and redirects on invalid values.
// Requirements: 6.1, 6.10
// =============================================================================

import { notFound } from 'next/navigation'
import { PracticeShell } from '@/components/editor/PracticeShell'
import { prisma } from '@/lib/db'
import type { DifficultyLevel } from '@/generated/prisma/enums'
import type { WritingMode } from '@/types'
import type { Prompt } from '@/types/prompt'

interface PracticePageProps {
  params: Promise<{ mode: string }>
  searchParams: Promise<{ promptId?: string; difficulty?: string }>
}

const VALID_MODES: WritingMode[] = ['EMAIL', 'DISCUSSION']

function normalizeMode(raw: string): WritingMode | null {
  const upper = raw.toUpperCase() as WritingMode
  return VALID_MODES.includes(upper) ? upper : null
}

export async function generateMetadata({ params }: PracticePageProps) {
  const { mode } = await params
  const writingMode = normalizeMode(mode)
  if (!writingMode) return {}
  return {
    title: writingMode === 'EMAIL' ? 'Writing an Email' : 'Academic Discussion',
  }
}

export default async function PracticePage({ params, searchParams }: PracticePageProps) {
  const { mode: rawMode } = await params
  const { promptId, difficulty } = await searchParams

  const writingMode = normalizeMode(rawMode)
  if (!writingMode) notFound()

  let prompt: Prompt | null = null

  // If a specific promptId is requested (e.g. "Try Again" flow), fetch it directly
  if (promptId) {
    const record = await prisma.prompt.findUnique({ where: { id: promptId } })
    if (record) {
      prompt = record as unknown as Prompt
    }
  }

  // Otherwise pick a random prompt for the mode + difficulty
  if (!prompt) {
    const resolvedDifficulty = difficulty ?? 'BEGINNER'
    const prompts = await prisma.prompt.findMany({
      where: {
        mode: writingMode,
        ...(resolvedDifficulty !== 'auto'
          ? { difficulty: resolvedDifficulty as DifficultyLevel }
          : {}),
      },
    })

    if (prompts.length === 0) notFound()

    prompt = prompts[Math.floor(Math.random() * prompts.length)] as unknown as Prompt
  }

  return <PracticeShell prompt={prompt} mode={writingMode} />
}
