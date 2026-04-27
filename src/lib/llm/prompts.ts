// =============================================================================
// LLM System Prompt Templates
// =============================================================================
// Builds mode-specific ETS rater instructions and user content for evaluation.
// Requirements: 8.1, 8.2
// =============================================================================

import type { Prompt, EmailPrompt, AcademicDiscussionPrompt } from '@/types/prompt'
import { WritingMode } from '@/types'

// ---------------------------------------------------------------------------
// JSON schema description embedded in every system prompt
// ---------------------------------------------------------------------------

const FEEDBACK_JSON_SCHEMA = `
{
  "overall_score": <integer 0-5>,
  "rubric_breakdown": {
    "development": <integer 0-5>,
    "organization": <integer 0-5>,
    "language_use": <integer 0-5>,
    "vocabulary": <integer 0-5>
  },
  "grammar_corrections": [
    {
      "original": "<original phrase>",
      "corrected": "<corrected phrase>",
      "explanation": "<brief explanation>"
    }
  ],
  "vocabulary_suggestions": [
    {
      "original": "<original word/phrase>",
      "suggested": "<better alternative>",
      "reason": "<why this is better>"
    }
  ],
  "coherence_analysis": "<paragraph describing overall coherence and flow>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "polished_version": "<full rewritten essay preserving the writer's ideas>"
}`.trim()

// ---------------------------------------------------------------------------
// Shared system prompt preamble
// ---------------------------------------------------------------------------

const ETS_RATER_PREAMBLE = `You are an expert ETS TOEFL iBT Writing rater with deep knowledge of the official ETS scoring rubric. Your task is to evaluate the provided essay and return a structured JSON assessment.

Scoring rubric (0–5 scale for each dimension):
- development: How well the writer develops and supports their ideas with relevant details and examples.
- organization: How clearly the essay is structured, with logical progression and effective use of transitions.
- language_use: Accuracy and range of grammatical structures; sentence variety and complexity.
- vocabulary: Precision, range, and appropriateness of word choice.

The overall_score should reflect the holistic quality of the response on the same 0–5 scale.

For polished_version: rewrite the essay to correct all errors and improve language quality while strictly preserving the writer's original ideas, arguments, and perspective.

You MUST respond with ONLY valid JSON matching this exact schema — no markdown fences, no commentary, no extra keys:

${FEEDBACK_JSON_SCHEMA}`

// ---------------------------------------------------------------------------
// Mode-specific context builders
// ---------------------------------------------------------------------------

function buildEmailContext(prompt: EmailPrompt): string {
  return `WRITING TASK TYPE: Writing an Email (TOEFL iBT)
Task time limit: 7 minutes | Target length: 100–130 words

SCENARIO:
${prompt.scenarioText}`
}

function buildDiscussionContext(prompt: AcademicDiscussionPrompt): string {
  const parts: string[] = [
    `WRITING TASK TYPE: Academic Discussion (TOEFL iBT)`,
    `Task time limit: 10 minutes | Minimum length: 100 words`,
    ``,
    `PROFESSOR'S PROMPT:`,
    prompt.professorPrompt,
  ]

  if (prompt.studentOpinionA) {
    parts.push(``, `STUDENT A's RESPONSE:`, prompt.studentOpinionA)
  }
  if (prompt.studentOpinionB) {
    parts.push(``, `STUDENT B's RESPONSE:`, prompt.studentOpinionB)
  }

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface EvaluationPrompt {
  systemPrompt: string
  userContent: string
}

/**
 * Builds the system prompt and user content for LLM evaluation.
 *
 * @param mode    - Writing mode (EMAIL or DISCUSSION)
 * @param prompt  - The full prompt record from the database
 * @param essay   - The practitioner's essay text
 */
export function buildEvaluationPrompt(
  mode: (typeof WritingMode)[keyof typeof WritingMode],
  prompt: Prompt,
  essay: string,
): EvaluationPrompt {
  let taskContext: string

  if (mode === WritingMode.EMAIL) {
    taskContext = buildEmailContext(prompt as EmailPrompt)
  } else {
    taskContext = buildDiscussionContext(prompt as AcademicDiscussionPrompt)
  }

  const userContent = `${taskContext}

STUDENT'S ESSAY:
${essay}

Evaluate the essay above and return your assessment as JSON.`

  return {
    systemPrompt: ETS_RATER_PREAMBLE,
    userContent,
  }
}
