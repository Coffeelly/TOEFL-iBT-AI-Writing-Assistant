'use client'

// =============================================================================
// ScoreTrendChart Component
// =============================================================================
// Recharts LineChart of overall scores over time, filterable by writing mode.
// Requirements: 12.3
// =============================================================================

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { WritingMode } from '@/types'

interface ScoreSeries {
  dates: string[]
  scores: number[]
}

interface ScoreTrendChartProps {
  scoresByMode: Record<WritingMode, ScoreSeries>
}

type ModeFilter = 'ALL' | WritingMode

/** Merge two mode series into a unified date-keyed dataset for the chart. */
function buildChartData(
  scoresByMode: Record<WritingMode, ScoreSeries>,
  filter: ModeFilter,
): Array<{ date: string; EMAIL?: number; DISCUSSION?: number }> {
  const map = new Map<string, { EMAIL?: number; DISCUSSION?: number }>()

  const modes: WritingMode[] = filter === 'ALL' ? ['EMAIL', 'DISCUSSION'] : [filter]

  for (const mode of modes) {
    const series = scoresByMode[mode]
    series.dates.forEach((date, i) => {
      const existing = map.get(date) ?? {}
      map.set(date, { ...existing, [mode]: series.scores[i] })
    })
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }))
}

const MODE_COLORS: Record<WritingMode, string> = {
  EMAIL: '#6366f1',      // brand-500
  DISCUSSION: '#10b981', // success
}

export function ScoreTrendChart({ scoresByMode }: ScoreTrendChartProps) {
  const [filter, setFilter] = useState<ModeFilter>('ALL')

  const data = buildChartData(scoresByMode, filter)
  const hasData = data.length > 0

  const modes: WritingMode[] = filter === 'ALL' ? ['EMAIL', 'DISCUSSION'] : [filter]

  return (
    <Card title="Score Trend">
      {/* Mode filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'EMAIL', 'DISCUSSION'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setFilter(m)}
            className={`
              rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-ring cursor-pointer
              ${
                filter === m
                  ? 'bg-brand-600 text-white'
                  : 'bg-background-secondary text-foreground-muted hover:text-foreground'
              }
            `}
          >
            {m === 'ALL' ? 'All Modes' : m.charAt(0) + m.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--foreground)',
              }}
              labelStyle={{ color: 'var(--foreground-muted)', marginBottom: 4 }}
            />
            {modes.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {modes.map((mode) => (
              <Line
                key={mode}
                type="monotone"
                dataKey={mode}
                name={mode.charAt(0) + mode.slice(1).toLowerCase()}
                stroke={MODE_COLORS[mode]}
                strokeWidth={2}
                dot={{ r: 3, fill: MODE_COLORS[mode] }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[240px] items-center justify-center text-sm text-foreground-muted">
          No submissions yet — complete a practice session to see your trend.
        </div>
      )}
    </Card>
  )
}
