type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
}

export function Spinner({ size = 'md', className = '', label = 'Loading...' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <div
        className={`
          rounded-full border-brand-200 border-t-brand-600
          animate-spin
          ${sizeStyles[size]}
        `}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
