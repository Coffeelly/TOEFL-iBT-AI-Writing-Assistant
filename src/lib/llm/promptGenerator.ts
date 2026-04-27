// =============================================================================
// LLM Prompt Generator
// =============================================================================
// Generates new TOEFL writing prompts using the configured LLM.
// =============================================================================

import { z } from 'zod'
import { LlmParseError } from './schema'
import type { WritingMode, DifficultyLevel } from '@/types'

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

export const generatedEmailPromptSchema = z.object({
  title: z.string().min(3),
  scenarioText: z.string().min(50),
})

export const generatedDiscussionPromptSchema = z.object({
  title: z.string().min(3),
  scenarioText: z.string().min(20),
  professorPrompt: z.string().min(50),
  studentOpinionA: z.string().min(30),
  studentOpinionB: z.string().min(30),
})

export type GeneratedEmailPrompt = z.infer<typeof generatedEmailPromptSchema>
export type GeneratedDiscussionPrompt = z.infer<typeof generatedDiscussionPromptSchema>
export type GeneratedPrompt = GeneratedEmailPrompt | GeneratedDiscussionPrompt

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const DIFFICULTY_GUIDANCE: Record<DifficultyLevel, string> = {
  BEGINNER:
    'The scenario should involve everyday social situations (helping a friend, borrowing something, making simple requests). Use simple, clear language. The three task points should be straightforward.',
  INTERMEDIATE:
    'The scenario should involve university or professional situations (requesting extensions, reporting problems, organizing events). Use moderately formal language. The three task points should require some explanation and reasoning.',
  ADVANCED:
    'The scenario should involve complex professional, academic, or institutional situations (proposing policy changes, negotiating terms, addressing systemic issues). Use formal language. The three task points should require nuanced argumentation and evidence.',
}

function buildEmailSystemPrompt(difficulty: DifficultyLevel): string {
  return `You are an expert TOEFL iBT test designer specializing in the Writing an Email task.

Your job is to generate ONE original, realistic TOEFL email writing prompt at the ${difficulty} level.

Difficulty guidance: ${DIFFICULTY_GUIDANCE[difficulty]}

The prompt MUST follow this exact format:
- A context paragraph (2-3 sentences) describing the situation and who the student is writing to.
- An instruction line: "Write an email to [person/organization]. In your email, do the following."
- Exactly THREE bullet points starting with "•" describing specific tasks the student must complete in the email.
- A closing line: "Write as much as you can and in complete sentences."

You MUST respond with ONLY valid JSON in this exact schema — no markdown, no commentary:
{
  "title": "<short descriptive title, 3-6 words>",
  "scenarioText": "<full prompt text following the format above, with \\n\\n between sections and \\n• for each bullet>"
}`
}

function buildDiscussionSystemPrompt(difficulty: DifficultyLevel): string {
  return `You are an expert TOEFL iBT test designer specializing in the Academic Discussion task.

Your job is to generate ONE original, realistic TOEFL academic discussion prompt at the ${difficulty} level.

Difficulty guidance: ${DIFFICULTY_GUIDANCE[difficulty]}

The prompt structure:
- scenarioText: A short framing sentence like "Your professor is teaching a class on [subject]. Write a post responding to the professor's question.\\n\\nIn your response, you should do the following.\\n\\n• Express and support your opinion.\\n• Make a contribution to the discussion in your own words.\\n\\nAn effective response will contain at least 100 words."
- professorPrompt: 3-5 sentences. Introduce the topic with context, present two opposing perspectives, and end with a direct question asking for the student's view.
- studentOpinionA: 3-4 sentences from a student named Claire, Maya, or Alex taking one clear position with a specific reason.
- studentOpinionB: 3-4 sentences from a student named Paul, Jordan, or Sam taking the opposing position with a specific reason.

You MUST respond with ONLY valid JSON in this exact schema — no markdown, no commentary:
{
  "title": "<short descriptive title, 3-6 words>",
  "scenarioText": "<framing text as described above>",
  "professorPrompt": "<professor question>",
  "studentOpinionA": "<first student response>",
  "studentOpinionB": "<second student response>"
}`
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = fenced
    ? fenced[1].trim()
    : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)

  if (!jsonStr) throw new LlmParseError(raw, { cause: new Error('No JSON found') })

  try {
    return JSON.parse(jsonStr)
  } catch (err) {
    throw new LlmParseError(raw, { cause: err })
  }
}

export function parseGeneratedPrompt(
  raw: string,
  mode: WritingMode,
): GeneratedPrompt {
  const parsed = extractJson(raw)

  if (mode === 'EMAIL') {
    const result = generatedEmailPromptSchema.safeParse(parsed)
    if (!result.success) throw new LlmParseError(raw, { cause: result.error })
    return result.data
  } else {
    const result = generatedDiscussionPromptSchema.safeParse(parsed)
    if (!result.success) throw new LlmParseError(raw, { cause: result.error })
    return result.data
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildPromptGenerationRequest(
  mode: WritingMode,
  difficulty: DifficultyLevel,
): { systemPrompt: string; userContent: string } {
  const systemPrompt =
    mode === 'EMAIL'
      ? buildEmailSystemPrompt(difficulty)
      : buildDiscussionSystemPrompt(difficulty)

  const userContent =
    mode === 'EMAIL'
      ? `Generate a new TOEFL Writing an Email prompt at ${difficulty} level. Return only the JSON.`
      : `Generate a new TOEFL Academic Discussion prompt at ${difficulty} level. Return only the JSON.`

  return { systemPrompt, userContent }
}
