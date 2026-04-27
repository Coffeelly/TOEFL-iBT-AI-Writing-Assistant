'use client'

// =============================================================================
// PolishedVersionPanel Component
// =============================================================================
// Tabbed comparison view: the practitioner's original essay alongside the
// AI-generated polished version.
// Requirements: 10.4
// =============================================================================

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

interface PolishedVersionPanelProps {
  originalEssay: string
  polishedVersion: string
}

type Tab = 'original' | 'polished' | 'side-by-side'

export function PolishedVersionPanel({ originalEssay, polishedVersion }: PolishedVersionPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('polished')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'polished', label: 'Polished' },
    { id: 'original', label: 'Your Essay' },
    { id: 'side-by-side', label: 'Compare' },
  ]

  return (
    <Card title="Polished Version">
      {/* Tab bar */}
      <div
        className="flex gap-1 mb-4 rounded-lg bg-background-secondary p-1"
        role="tablist"
        aria-label="Essay comparison tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
              ${
                activeTab === tab.id
                  ? 'bg-card-bg text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === 'polished' && (
        <div
          id="panel-polished"
          role="tabpanel"
          aria-labelledby="tab-polished"
        >
          <EssayBlock label="Polished Version" text={polishedVersion} highlight />
        </div>
      )}

      {activeTab === 'original' && (
        <div
          id="panel-original"
          role="tabpanel"
          aria-labelledby="tab-original"
        >
          <EssayBlock label="Your Essay" text={originalEssay} />
        </div>
      )}

      {activeTab === 'side-by-side' && (
        <div
          id="panel-side-by-side"
          role="tabpanel"
          aria-labelledby="tab-side-by-side"
          className="grid gap-4 sm:grid-cols-2"
        >
          <EssayBlock label="Your Essay" text={originalEssay} />
          <EssayBlock label="Polished Version" text={polishedVersion} highlight />
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Internal sub-component
// ---------------------------------------------------------------------------

interface EssayBlockProps {
  label: string
  text: string
  highlight?: boolean
}

function EssayBlock({ label, text, highlight = false }: EssayBlockProps) {
  return (
    <div>
      <p
        className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
          highlight ? 'text-brand-600 dark:text-brand-400' : 'text-foreground-muted'
        }`}
      >
        {label}
      </p>
      <div
        className={`
          rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap
          ${
            highlight
              ? 'border-brand-200 dark:border-brand-800 bg-background-secondary text-foreground'
              : 'border-card-border bg-background-secondary text-foreground'
          }
        `}
      >
        {text || <span className="italic text-foreground-muted">No content.</span>}
      </div>
    </div>
  )
}
