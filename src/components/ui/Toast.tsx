'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  variant?: ToastVariant
  duration?: number
  isVisible: boolean
  onClose: () => void
  icon?: ReactNode
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  error: 'border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200',
  info: 'border-brand-500/30 bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200',
}

const defaultIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

export function Toast({
  message,
  variant = 'info',
  duration = 4000,
  isVisible,
  onClose,
  icon,
}: ToastProps) {
  const [shouldRender, setShouldRender] = useState(isVisible)

  const handleClose = useCallback(() => {
    setShouldRender(false)
    setTimeout(onClose, 200)
  }, [onClose])

  useEffect(() => {
    if (!isVisible) return
    if (duration <= 0) return
    const timer = setTimeout(handleClose, duration)
    return () => clearTimeout(timer)
  }, [isVisible, duration, handleClose])

  // Sync render state with visibility on mount/change
  if (isVisible && !shouldRender) {
    setShouldRender(true)
  }

  if (!isVisible && !shouldRender) return null

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-3
        rounded-lg border px-4 py-3
        shadow-lg
        transition-all duration-200
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
        ${variantStyles[variant]}
      `}
      role="alert"
      aria-live="polite"
    >
      <span className="text-base font-semibold" aria-hidden="true">
        {icon || defaultIcons[variant]}
      </span>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity focus-ring rounded cursor-pointer"
        aria-label="Dismiss notification"
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
