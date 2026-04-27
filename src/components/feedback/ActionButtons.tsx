'use client'

// =============================================================================
// ActionButtons Component
// =============================================================================
// "Try Again" and "New Prompt" navigation buttons shown at the bottom of the
// feedback page.
// Requirements: 10.5, 10.6
// =============================================================================

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { WritingMode } from '@/types'

interface ActionButtonsProps {
  mode: WritingMode
  promptId: string
}

export function ActionButtons({ mode, promptId }: ActionButtonsProps) {
  const router = useRouter()
  const modeSlug = mode.toLowerCase() as 'email' | 'discussion'

  return (
    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
      <Button
        variant="primary"
        onClick={() => router.push(`/practice/${modeSlug}?promptId=${promptId}`)}
      >
        Try Again
      </Button>
      <Button
        variant="outline"
        onClick={() => router.push(`/practice/${modeSlug}`)}
      >
        New Prompt
      </Button>
    </div>
  )
}
