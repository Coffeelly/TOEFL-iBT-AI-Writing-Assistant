// =============================================================================
// StatsOverview Component
// =============================================================================
// Displays high-level statistics: total submissions, average score, best score,
// total practice time, and current difficulty level.
// Requirements: 12.3, 12.5
// =============================================================================

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { DifficultyLevel } from '@/types'

interface StatsOverviewProps {
  totalSubmissions: number
  averageScore: number | null
  bestScore: number | null
  totalPracticeTimeSec: number
  currentLevel: DifficultyLevel
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${totalSeconds}s`
}

const levelVariant: Record<DifficultyLevel, 'success' | 'warning' | 'error'> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'error',
}

interface StatTileProps {
  label: string
  value: string
  sub?: string
}

function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
        {label}
      </span>
      <span className="text-3xl font-bold text-foreground tabular-nums">{value}</span>
      {sub && <span className="text-xs text-foreground-muted">{sub}</span>}
    </div>
  )
}

export function StatsOverview({
  totalSubmissions,
  averageScore,
  bestScore,
  totalPracticeTimeSec,
  currentLevel,
}: StatsOverviewProps) {
  return (
    <Card title="Overview">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <StatTile
          label="Submissions"
          value={String(totalSubmissions)}
          sub="total attempts"
        />
        <StatTile
          label="Avg Score"
          value={averageScore !== null ? averageScore.toFixed(1) : '—'}
          sub="out of 5.0"
        />
        <StatTile
          label="Best Score"
          value={bestScore !== null ? bestScore.toFixed(1) : '—'}
          sub="personal best"
        />
        <StatTile
          label="Practice Time"
          value={formatDuration(totalPracticeTimeSec)}
          sub="total time"
        />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span className="text-sm text-foreground-muted">Current level:</span>
        <Badge variant={levelVariant[currentLevel]} size="md">
          {currentLevel.charAt(0) + currentLevel.slice(1).toLowerCase()}
        </Badge>
      </div>
    </Card>
  )
}
