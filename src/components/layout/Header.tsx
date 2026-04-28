'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useExamContext } from '@/contexts/ExamContext'

const authedNav = [
  { name: 'Practice', href: '/' },
  { name: 'Grammar Fix', href: '/grammar' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'History', href: '/history' },
  { name: 'Settings', href: '/settings' },
]

const guestNav = [
  { name: 'Practice', href: '/' },
  { name: 'Grammar Fix', href: '/grammar' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const { isExamActive } = useExamContext()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Hide the entire header during an active exam session so nav links
  // cannot be used to leave the practice page.
  if (isExamActive) return null

  const navigation = user ? authedNav : guestNav

  function handleLogout() {
    logout()
    setMobileMenuOpen(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-[var(--header-border)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-ring rounded-lg"
          aria-label="TOEFL Helper Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <span className="text-lg font-bold text-white" aria-hidden="true">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            TOEFL <span className="text-brand-600 dark:text-brand-400">Helper</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  relative px-3 py-2 text-sm font-medium rounded-lg transition-colors focus-ring
                  ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.name}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Auth Area */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-background-secondary" aria-hidden="true" />
          ) : user ? (
            <>
              <span className="text-sm font-medium text-foreground-muted" aria-label={`Signed in as ${user.displayName}`}>
                {user.displayName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors focus-ring rounded-lg cursor-pointer"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors focus-ring rounded-lg"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors focus-ring"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors focus-ring md:hidden cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-[var(--header-border)] px-4 py-3 animate-slide-down md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring
                    ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--header-border)] pt-3">
            {user ? (
              <>
                <p className="px-3 py-1 text-sm font-medium text-foreground-muted">{user.displayName}</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors focus-ring cursor-pointer"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors focus-ring"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors focus-ring"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
