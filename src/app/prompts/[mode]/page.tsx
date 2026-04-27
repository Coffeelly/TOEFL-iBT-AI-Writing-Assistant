// =============================================================================
// Prompt Selection Page (RSC)
// =============================================================================
// Lists all available prompts for a given writing mode, grouped by difficulty.
// The user picks a prompt and is taken directly to the practice page for it.
// For authenticated users, shows the most recent submission result per prompt.
// =============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { STORAGE_KEYS } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GeneratePromptButton } from '@/components/prompts/GeneratePromptButton'
import type { WritingMode, DifficultyLevel } from '@/types'
import type { Metadata } from 'next'

interface PromptsPageProps {
  params: Promise<{ mode: string }>
}

const VALID_MODES = ['email', 'discussion'] as const
type ModeSlug = (typeof VALID_MODES)[number]

function normalizeMode(raw: string): ModeSlug | null {
  const lower = raw.toLowerCase() as ModeSlug
  return VALID_MODES.includes(lower) ? lower : null
}

const MODE_LABELS: Record<ModeSlug, string> = {
  email: 'Writing an Email',
  discussion: 'Academic Discussion',
}

const MODE_META: Record<ModeSlug, string> = {
  email: '7 minutes · 100–130 words',
  discussion: '10 minutes · 100+ words',
}

const DIFFICULTY_ORDER: DifficultyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
}

const DIFFICULTY_VARIANTS: Record<DifficultyLevel, 'success' | 'warning' | 'error'> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'error',
}

function scoreVariant(score: number | null): 'error' | 'warning' | 'success' | 'default' {
  if (score === null) return 'default'
  if (score <= 2) return 'error'
  if (score === 3) return 'warning'
  return 'success'
}

export async function generateMetadata({ params }: PromptsPageProps): Promise<Metadata> {
  const { mode } = await params
  const slug = normalizeMode(mode)
  if (!slug) return {}
  return { title: `Choose a Prompt — ${MODE_LABELS[slug]}` }
}

export default async function PromptsPage({ params }: PromptsPageProps) {
  const { mode: rawMode } = await params
  const slug = normalizeMode(rawMode)
  if (!slug) notFound()

  const dbMode: WritingMode = slug === 'email' ? 'EMAIL' : 'DISCUSSION'

  // ---------------------------------------------------------------------------
  // Resolve authenticated user (if any) to look up their submission history
  // ---------------------------------------------------------------------------
  const cookieStore = await cookies()
  const authToken = cookieStore.get(STORAGE_KEYS.AUTH_TOKEN)?.value ?? null
  const payload = authToken ? await verifyToken(authToken) : null
  const userId = payload?.sub ?? null

  // ---------------------------------------------------------------------------
  // Fetch prompts + most recent submission per prompt for this user
  // ---------------------------------------------------------------------------
  const [prompts, userSubmissions] = await Promise.all([
    prisma.prompt.findMany({
      where: { mode: dbMode },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        difficulty: true,
        scenarioText: true,
      },
    }),
    userId
      ? prisma.submission.findMany({
          where: {
            userId,
            prompt: { mode: dbMode },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            promptId: true,
            overallScore: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ])

  if (prompts.length === 0) notFound()

  // Build a map of promptId → most recent submission (already ordered desc)
  const latestSubmissionByPrompt = new Map<
    string,
    { id: string; overallScore: number | null }
  >()
  for (const sub of userSubmissions) {
    if (!latestSubmissionByPrompt.has(sub.promptId)) {
      latestSubmissionByPrompt.set(sub.promptId, {
        id: sub.id,
        overallScore: sub.overallScore,
      })
    }
  }

  // Group by difficulty
  const grouped = DIFFICULTY_ORDER.reduce<Record<DifficultyLevel, typeof prompts>>(
    (acc, level) => {
      acc[level] = prompts.filter((p) => p.difficulty === level)
      return acc
    },
    { BEGINNER: [], INTERMEDIATE: [], ADVANCED: [] },
  )

  // Extract the first sentence of scenarioText as a short preview
  function getPreview(scenarioText: string): string {
    const firstSentence = scenarioText.split(/(?<=[.!?])\s/)[0] ?? scenarioText
    return firstSentence.length > 120
      ? firstSentence.slice(0, 117) + '…'
      : firstSentence
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </Link>

      {/* Page heading */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{MODE_LABELS[slug]}</h1>
            <p className="mt-1 text-sm text-foreground-muted">{MODE_META[slug]}</p>
          </div>
        </div>
        {/* Generate new question */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-foreground-muted">Generate a new question with AI:</span>
          <GeneratePromptButton mode={dbMode} />
        </div>
      </div>

      {/* Difficulty groups */}
      <div className="space-y-10">
        {DIFFICULTY_ORDER.map((level) => {
          const group = grouped[level]
          if (group.length === 0) return null
          return (
            <section key={level}>
              {/* Difficulty heading */}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={DIFFICULTY_VARIANTS[level]}>
                  {DIFFICULTY_LABELS[level]}
                </Badge>
                <span className="text-xs text-foreground-muted">
                  {group.length} prompt{group.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Prompt cards */}
              <div className="space-y-3">
                {group.map((prompt) => {
                  const submission = latestSubmissionByPrompt.get(prompt.id) ?? null
                  const isAnswered = submission !== null

                  return (
                    <Card key={prompt.id} className="p-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h2 className="text-base font-semibold text-foreground">
                              {prompt.title}
                            </h2>
                            {isAnswered && (
                              <Badge variant={scoreVariant(submission.overallScore)} size="sm">
                                {submission.overallScore !== null
                                  ? `${submission.overallScore} / 5`
                                  : 'Done'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground-muted leading-relaxed">
                            {getPreview(prompt.scenarioText)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {isAnswered ? (
                            <>
                              <Link
                                href={`/history/${submission.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-card-bg transition-colors focus-ring"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                View Result
                              </Link>
                              <Link
                                href={`/practice/${slug}?promptId=${prompt.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors focus-ring"
                              >
                                Retry
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                  <path d="M3 3v5h5" />
                                </svg>
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/practice/${slug}?promptId=${prompt.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors focus-ring"
                            >
                              Start
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

interface PromptsPageProps {
  params: Promise<{ mode: string }>
}



