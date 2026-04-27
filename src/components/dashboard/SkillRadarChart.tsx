'use client'

// =============================================================================
// SkillRadarChart Component
// =============================================================================
// Recharts RadarChart of average rubric sub-scores across all submissions.
// Requirements: 12.4
// =============================================================================

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { RubricBreakdown } from '@/types/feedback'

interface SkillRadarChartProps {
  rubricAverages: RubricBreakdown | null
}

const RUBRIC_LABELS: Record<keyof RubricBreakdown, string> = {
  development: 'Development',
  organization: 'Organization',
  language_use: 'Language Use',
  vocabulary: 'Vocabulary',
}

export function SkillRadarChart({ rubricAverages }: SkillRadarChartProps) {
  if (!rubricAverages) {
    return (
      <Card title="Skill Breakdown">
        <div className="flex h-[240px] items-center justify-center text-sm text-foreground-muted">
          No scored submissions yet — complete a practice session to see your skill breakdown.
        </div>
      </Card>
    )
  }

  const data = (Object.keys(RUBRIC_LABELS) as Array<keyof RubricBreakdown>).map((key) => ({
    skill: RUBRIC_LABELS[key],
    score: parseFloat(rubricAverages[key].toFixed(2)),
    fullMark: 5,
  }))

  return (
    <Card title="Skill Breakdown">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="var(--card-border)" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fontSize: 10, fill: 'var(--foreground-muted)' }}
            tickCount={4}
          />
          <Radar
            name="Avg Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--foreground)',
            }}
            formatter={(value: number) => [value.toFixed(2), 'Avg Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  )
}
