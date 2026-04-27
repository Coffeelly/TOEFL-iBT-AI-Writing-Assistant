// =============================================================================
// Practice Loading Skeleton
// =============================================================================
// Displayed by Next.js while the practice page RSC is streaming.
// Requirements: 6.10
// =============================================================================

export default function PracticeLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 animate-pulse" aria-busy="true" aria-label="Loading practice session">
      {/* Prompt card skeleton */}
      <div className="mb-6 rounded-xl border border-card-border bg-card-bg p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-24 rounded-full bg-background-secondary" />
          <div className="h-4 w-32 rounded bg-background-secondary" />
        </div>
        <div className="h-6 w-2/3 rounded bg-background-secondary mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-background-secondary" />
          <div className="h-4 w-5/6 rounded bg-background-secondary" />
          <div className="h-4 w-4/6 rounded bg-background-secondary" />
        </div>
      </div>

      {/* Timer + word count bar skeleton */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-card-border bg-background-secondary px-4 py-2">
        <div className="h-6 w-20 rounded bg-card-border" />
        <div className="h-4 w-16 rounded bg-card-border" />
      </div>

      {/* Textarea skeleton */}
      <div className="min-h-[320px] w-full rounded-xl border border-card-border bg-card-bg" />

      {/* Submit button skeleton */}
      <div className="mt-4 flex justify-end">
        <div className="h-12 w-28 rounded-lg bg-background-secondary" />
      </div>
    </div>
  )
}
