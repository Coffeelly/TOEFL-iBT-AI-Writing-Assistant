'use client'

import { type ReactNode, useEffect, useRef, useCallback } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose()
      }
    },
    [onClose],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className="
        fixed inset-0 z-50 m-auto
        w-full max-w-lg rounded-xl
        border border-card-border bg-card-bg
        shadow-lg
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
        animate-scale-in
        p-0
      "
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={`flex flex-col ${className}`}>
        {title && (
          <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
            <h2 id="modal-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="
                flex h-8 w-8 items-center justify-center rounded-lg
                text-foreground-muted hover:text-foreground hover:bg-background-secondary
                transition-colors focus-ring cursor-pointer
              "
              aria-label="Close dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </dialog>
  )
}
