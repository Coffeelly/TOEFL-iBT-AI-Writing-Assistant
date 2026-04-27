import Link from 'next/link'
import { ModeSelectionCards } from '@/components/ModeSelectionCards'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-2xl text-center animate-fade-in">
        {/* Hero Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          AI-Powered TOEFL Writing Practice
        </div>

        {/* Hero Heading */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Master Your{' '}
          <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            TOEFL Writing
          </span>
        </h1>

        <p className="mt-4 text-lg text-foreground-muted sm:text-xl">
          Practice with real prompts, get instant AI feedback, and track your progress. Choose your writing mode to begin.
        </p>

        {/* Mode Selection Cards — reads difficulty override from localStorage */}
        <ModeSelectionCards />

        {/* Guest note */}
        {/* <p className="mt-6 text-sm text-foreground-muted">
          No account needed to start practicing.{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            Sign up
          </Link>{' '}
          to save your progress.
        </p> */}
      </div>
    </div>
  )
}
