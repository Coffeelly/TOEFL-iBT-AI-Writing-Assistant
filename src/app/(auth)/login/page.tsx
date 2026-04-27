'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      console.log('[Login] Starting login...')
      await login(email, password)
      console.log('[Login] Login successful, navigating to /dashboard')
      router.push('/dashboard')
      console.log('[Login] router.push called')
    } catch (err) {
      console.error('[Login] Login failed:', err)
      const e = err as Error & { status?: number }
      if (e.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError(e.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-foreground-muted">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error dark:bg-red-950/20" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700 focus-ring rounded dark:text-brand-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
