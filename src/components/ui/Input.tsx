import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={`
            h-10 w-full rounded-lg border px-3 text-sm
            transition-colors duration-150
            placeholder:text-foreground-muted/60
            focus-ring
            ${
              error
                ? 'border-error bg-red-50 dark:bg-red-950/20'
                : 'border-[var(--input-border)] bg-[var(--input-bg)] hover:border-brand-400'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-foreground-muted">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
