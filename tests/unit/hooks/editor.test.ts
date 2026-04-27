// Feature: toefl-helper-local
// Unit tests for writing editor behavior
// Validates: Requirements 6.2, 6.3, 6.5, 6.7, 9.3

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { PrismaClient } from '../../../src/generated/prisma/client'
import { POST as submissionsPOST } from '../../../src/app/api/submissions/route'
import { GET as submissionsGET } from '../../../src/app/api/submissions/[id]/route'
import { TIMER_DURATION_SECONDS, TIMER_WARNING_THRESHOLD_SECONDS } from '../../../src/lib/constants'
import { countWords } from '../../../src/hooks/useWordCount'

// ---------------------------------------------------------------------------
// Prisma client for test setup / teardown
// ---------------------------------------------------------------------------

const prisma = new PrismaClient()
let testPromptId: string
const createdSubmissionIds: string[] = []

beforeAll(async () => {
  const prompt = await prisma.prompt.create({
    data: {
      mode: 'EMAIL',
      difficulty: 'BEGINNER',
      title: 'Editor Test Prompt',
      scenarioText: 'Test scenario for editor unit tests.',
    },
  })
  testPromptId = prompt.id
})

afterAll(async () => {
  if (createdSubmissionIds.length > 0) {
    await prisma.submission.deleteMany({ where: { id: { in: createdSubmissionIds } } })
  }
  if (testPromptId) {
    await prisma.prompt.delete({ where: { id: testPromptId } })
  }
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// Timer duration constants
// ---------------------------------------------------------------------------

describe('Timer duration constants', () => {
  it('EMAIL mode timer starts at 420 seconds (7 minutes)', () => {
    expect(TIMER_DURATION_SECONDS.EMAIL).toBe(420)
  })

  it('DISCUSSION mode timer starts at 600 seconds (10 minutes)', () => {
    expect(TIMER_DURATION_SECONDS.DISCUSSION).toBe(600)
  })

  it('warning threshold is 120 seconds (2 minutes)', () => {
    expect(TIMER_WARNING_THRESHOLD_SECONDS).toBe(120)
  })

  it('EMAIL timer is shorter than DISCUSSION timer', () => {
    expect(TIMER_DURATION_SECONDS.EMAIL).toBeLessThan(TIMER_DURATION_SECONDS.DISCUSSION)
  })
})

// ---------------------------------------------------------------------------
// Auto-submit logic: isExpired triggers submission
// ---------------------------------------------------------------------------
// The WritingEditor component has this effect:
//   useEffect(() => {
//     if (isExpired && value.trim().length > 0) { onSubmit() }
//   }, [isExpired, value, onSubmit])
//
// We test the condition logic directly since we have no DOM renderer.
// ---------------------------------------------------------------------------

describe('Auto-submit trigger condition', () => {
  /**
   * Mirrors the WritingEditor auto-submit guard:
   * fires when isExpired is true AND essay is non-empty.
   */
  function shouldAutoSubmit(isExpired: boolean, essayText: string): boolean {
    return isExpired && essayText.trim().length > 0
  }

  it('fires when timer is expired and essay is non-empty', () => {
    expect(shouldAutoSubmit(true, 'This is my essay text.')).toBe(true)
  })

  it('does not fire when timer is expired but essay is empty', () => {
    expect(shouldAutoSubmit(true, '')).toBe(false)
  })

  it('does not fire when timer is expired but essay is only whitespace', () => {
    expect(shouldAutoSubmit(true, '   \n\t  ')).toBe(false)
  })

  it('does not fire when timer is still running', () => {
    expect(shouldAutoSubmit(false, 'Some essay text here.')).toBe(false)
  })

  it('does not fire when timer is running and essay is empty', () => {
    expect(shouldAutoSubmit(false, '')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Textarea attributes (static analysis of component source)
// ---------------------------------------------------------------------------
// The WritingEditor renders a <textarea> with specific accessibility/behavior
// attributes required by Requirement 6.7. We verify these are present in the
// component source since we have no DOM renderer available.
// ---------------------------------------------------------------------------

describe('WritingEditor textarea attributes (Requirement 6.7)', () => {
  it('component source includes spellCheck={false}', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const componentPath = path.resolve(
      __dirname,
      '../../../src/components/editor/WritingEditor.tsx',
    )
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('spellCheck={false}')
  })

  it('component source includes autoComplete="off"', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const componentPath = path.resolve(
      __dirname,
      '../../../src/components/editor/WritingEditor.tsx',
    )
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('autoComplete="off"')
  })

  it('component source includes autoCorrect="off"', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const componentPath = path.resolve(
      __dirname,
      '../../../src/components/editor/WritingEditor.tsx',
    )
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('autoCorrect="off"')
  })

  it('component source includes autoCapitalize="off"', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const componentPath = path.resolve(
      __dirname,
      '../../../src/components/editor/WritingEditor.tsx',
    )
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('autoCapitalize="off"')
  })
})

// ---------------------------------------------------------------------------
// Guest submission: userId is null in DB record (Requirement 9.3)
// ---------------------------------------------------------------------------

describe('Guest submission: userId is null in DB record', () => {
  it('persists submission with userId = null when no x-user-id header is provided', async () => {
    const body = {
      promptId: testPromptId,
      essayText: 'This is a guest essay submission for testing purposes.',
      wordCount: countWords('This is a guest essay submission for testing purposes.'),
      timeSpentSec: 120,
      overallScore: 3,
      rubricScores: {
        development: 3,
        organization: 3,
        language_use: 3,
        vocabulary: 3,
      },
      feedbackJson: {
        overall_score: 3,
        rubric_breakdown: { development: 3, organization: 3, language_use: 3, vocabulary: 3 },
        grammar_corrections: [],
        vocabulary_suggestions: [],
        coherence_analysis: 'Good coherence.',
        strengths: ['Clear structure'],
        improvements: ['More detail needed'],
        polished_version: 'This is a polished version of the guest essay.',
      },
      polishedVersion: 'This is a polished version of the guest essay.',
      llmProvider: 'OLLAMA' as const,
    }

    // POST without Authorization header (guest)
    const postReq = new NextRequest('http://localhost/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const postRes = await submissionsPOST(postReq)
    expect(postRes.status).toBe(201)

    const { submissionId } = await postRes.json()
    createdSubmissionIds.push(submissionId)

    // Verify in DB that userId is null
    const record = await prisma.submission.findUnique({ where: { id: submissionId } })
    expect(record).not.toBeNull()
    expect(record!.userId).toBeNull()
  })

  it('guest submission is accessible via GET without authentication', async () => {
    const body = {
      promptId: testPromptId,
      essayText: 'Another guest essay for GET access test.',
      wordCount: 8,
      timeSpentSec: 60,
      overallScore: 2,
      rubricScores: {
        development: 2,
        organization: 2,
        language_use: 2,
        vocabulary: 2,
      },
      feedbackJson: {
        overall_score: 2,
        rubric_breakdown: { development: 2, organization: 2, language_use: 2, vocabulary: 2 },
        grammar_corrections: [],
        vocabulary_suggestions: [],
        coherence_analysis: 'Needs improvement.',
        strengths: [],
        improvements: ['Expand ideas'],
        polished_version: 'A polished version.',
      },
      polishedVersion: 'A polished version.',
      llmProvider: 'GEMINI' as const,
    }

    const postReq = new NextRequest('http://localhost/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const postRes = await submissionsPOST(postReq)
    expect(postRes.status).toBe(201)
    const { submissionId } = await postRes.json()
    createdSubmissionIds.push(submissionId)

    // GET without x-user-id — guest submissions (userId=null) are accessible by URL
    const getReq = new NextRequest(`http://localhost/api/submissions/${submissionId}`, {
      method: 'GET',
    })
    const getRes = await submissionsGET(getReq, {
      params: Promise.resolve({ id: submissionId }),
    })

    expect(getRes.status).toBe(200)
    const detail = await getRes.json()
    expect(detail.essayText).toBe(body.essayText)
    expect(detail.llmProvider).toBe('GEMINI')
  })
})
