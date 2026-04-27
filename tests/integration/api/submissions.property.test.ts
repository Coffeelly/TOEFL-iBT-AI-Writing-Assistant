// Feature: toefl-helper-local, Property 8: Submission persistence round-trip
// Validates: Requirements 9.1, 9.3

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'
import { PrismaClient } from '../../../src/generated/prisma/client'
import { POST } from '../../../src/app/api/submissions/route'
import { GET } from '../../../src/app/api/submissions/[id]/route'

// ---------------------------------------------------------------------------
// Prisma client for test setup / teardown
// ---------------------------------------------------------------------------

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Test prompt — created once, cleaned up after all tests
// ---------------------------------------------------------------------------

let testPromptId: string
const createdSubmissionIds: string[] = []

beforeAll(async () => {
  const prompt = await prisma.prompt.create({
    data: {
      mode: 'EMAIL',
      difficulty: 'BEGINNER',
      title: 'Property Test Prompt',
      scenarioText: 'This is a test prompt for property-based testing of submission persistence.',
    },
  })
  testPromptId = prompt.id
})

afterAll(async () => {
  // Clean up submissions created during tests
  if (createdSubmissionIds.length > 0) {
    await prisma.submission.deleteMany({
      where: { id: { in: createdSubmissionIds } },
    })
  }
  // Clean up the test prompt
  if (testPromptId) {
    await prisma.prompt.delete({ where: { id: testPromptId } })
  }
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a NextRequest for POST /api/submissions with the given body.
 * No Authorization header — guest submission (userId = null).
 */
function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * Build a NextRequest for GET /api/submissions/[id].
 * No Authorization header — guest access (no userId check for null-userId submissions).
 */
function makeGetRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/submissions/${id}`, {
    method: 'GET',
  })
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid rubric breakdown object with scores in [0, 5].
 * Uses integer scores to avoid SQLite JSON float precision issues.
 */
const arbitraryRubricScores = fc.record({
  development: fc.integer({ min: 0, max: 5 }),
  organization: fc.integer({ min: 0, max: 5 }),
  language_use: fc.integer({ min: 0, max: 5 }),
  vocabulary: fc.integer({ min: 0, max: 5 }),
})

/**
 * Generates a valid FeedbackResponse-shaped object for feedbackJson.
 * Uses integer scores to avoid SQLite JSON float precision issues with subnormals.
 */
const arbitraryFeedbackJson = fc.record({
  overall_score: fc.integer({ min: 0, max: 5 }),
  rubric_breakdown: arbitraryRubricScores,
  grammar_corrections: fc.array(
    fc.record({
      original: fc.string({ minLength: 1, maxLength: 50 }),
      corrected: fc.string({ minLength: 1, maxLength: 50 }),
      explanation: fc.string({ minLength: 1, maxLength: 100 }),
    }),
    { maxLength: 3 },
  ),
  vocabulary_suggestions: fc.array(
    fc.record({
      original: fc.string({ minLength: 1, maxLength: 30 }),
      suggested: fc.string({ minLength: 1, maxLength: 30 }),
      reason: fc.string({ minLength: 1, maxLength: 80 }),
    }),
    { maxLength: 3 },
  ),
  coherence_analysis: fc.string({ minLength: 1, maxLength: 200 }),
  strengths: fc.array(fc.string({ minLength: 1, maxLength: 80 }), { maxLength: 3 }),
  improvements: fc.array(fc.string({ minLength: 1, maxLength: 80 }), { maxLength: 3 }),
  polished_version: fc.string({ minLength: 1, maxLength: 500 }),
})

/**
 * Generates a valid CreateSubmissionBody.
 * promptId is injected at test time from the seeded test prompt.
 */
function makeArbitrarySubmissionBody(promptId: string) {
  return fc.record({
    promptId: fc.constant(promptId),
    essayText: fc.string({ minLength: 1, maxLength: 500 }),
    wordCount: fc.integer({ min: 0, max: 1000 }),
    timeSpentSec: fc.integer({ min: 0, max: 600 }),
    overallScore: fc.integer({ min: 0, max: 5 }),
    rubricScores: fc.record({
      development: fc.integer({ min: 0, max: 5 }),
      organization: fc.integer({ min: 0, max: 5 }),
      language_use: fc.integer({ min: 0, max: 5 }),
      vocabulary: fc.integer({ min: 0, max: 5 }),
    }),
    feedbackJson: arbitraryFeedbackJson,
    polishedVersion: fc.string({ minLength: 1, maxLength: 500 }),
    llmProvider: fc.constantFrom('OLLAMA' as const, 'GEMINI' as const),
  })
}

// ---------------------------------------------------------------------------
// Property 8: Submission persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 8: Submission persistence round-trip', () => {
  it(
    'POST then GET returns matching essayText, wordCount, timeSpentSec, feedbackJson, promptId, llmProvider',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          makeArbitrarySubmissionBody(testPromptId),
          async (body) => {
            // --- POST /api/submissions ---
            const postReq = makePostRequest(body)
            const postRes = await POST(postReq)

            expect(postRes.status).toBe(201)

            const postJson = await postRes.json()
            expect(postJson).toHaveProperty('submissionId')
            const submissionId: string = postJson.submissionId

            // Track for cleanup
            createdSubmissionIds.push(submissionId)

            // --- GET /api/submissions/[id] ---
            const getReq = makeGetRequest(submissionId)
            const getRes = await GET(getReq, {
              params: Promise.resolve({ id: submissionId }),
            })

            expect(getRes.status).toBe(200)

            const getJson = await getRes.json()

            // Assert all required fields match
            expect(getJson.essayText).toBe(body.essayText)
            expect(getJson.wordCount).toBe(body.wordCount)
            expect(getJson.timeSpentSec).toBe(body.timeSpentSec)
            expect(getJson.llmProvider).toBe(body.llmProvider)
            expect(getJson.prompt.id).toBe(body.promptId)

            // feedbackJson is stored as JSON and returned as a parsed object —
            // deep-equal the serialized forms to handle float precision consistently
            expect(JSON.stringify(getJson.feedbackJson)).toBe(
              JSON.stringify(body.feedbackJson),
            )
          },
        ),
        { numRuns: 200 },
      )
    },
    // Generous timeout for 200 DB round-trips
    120_000,
  )
})
