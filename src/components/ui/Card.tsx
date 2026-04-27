import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  /** When true, adds hover elevation and scale effect */
  interactive?: boolean
}

export function Card({ title, children, footer, className = '', interactive = false }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-card-border bg-card-bg
        shadow-sm
        ${interactive ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-300 cursor-pointer' : ''}
        ${className}
      `}
    >
      {title && (
        <div className="border-b border-card-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="border-t border-card-border px-5 py-3 bg-background-secondary/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  )
}
