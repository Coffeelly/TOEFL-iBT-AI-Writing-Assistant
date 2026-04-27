'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError(null)
    setIsLoading(true)
    try {
      await register(email, password, displayName)
      router.push('/dashboard')
    } catch (err) {
      const e = err as Error & { status?: number; details?: { path: string[]; message: string }[] }
      if (e.status === 409) {
        setFieldErrors({ email: 'This email is already registered.' })
      } else if (e.status === 400 && Array.isArray(e.details)) {
        const errs: Record<string, string> = {}
        for (const issue of e.details) {
          const field = issue.path?.[0]
          if (field) errs[field] = issue.message
        }
        setFieldErrors(errs)
      } else {
        setGlobalError(e.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
          <p className="mt-2 text-sm text-foreground-muted">Start tracking your TOEFL writing progress</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Display name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={fieldErrors.displayName}
            required
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint="Minimum 8 characters"
            required
          />

          {globalError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error dark:bg-red-950/20" role="alert">
              {globalError}
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 focus-ring rounded dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
