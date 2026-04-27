'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  register(email: string, password: string, displayName: string): Promise<void>
  logout(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: restore session from stored token (localStorage or cookie)
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!token) {
      setIsLoading(false)
      return
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data ?? null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.error ?? 'Login failed') as Error & { status: number; details?: unknown }
      err.status = res.status
      err.details = data.details
      throw err
    }
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token)
    // Also set a cookie so the middleware can read it on page navigations
    document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.error ?? 'Registration failed') as Error & { status: number; details?: unknown }
      err.status = res.status
      err.details = data.details
      throw err
    }
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token)
    // Also set a cookie so the middleware can read it on page navigations
    document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    // Clear the auth cookie
    document.cookie = `${STORAGE_KEYS.AUTH_TOKEN}=; path=/; max-age=0`
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
