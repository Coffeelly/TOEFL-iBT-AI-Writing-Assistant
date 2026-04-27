// =============================================================================
// Next.js Proxy — Auth Guard
// =============================================================================
// Protects page and API routes. Reads the JWT from the auth cookie
// (set on login/register) for page navigations, and from the Authorization
// header for API calls.
// Requirements: 3.6, 3.7, 3.8
// =============================================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractBearerToken, verifyToken } from '@/lib/auth'
import { STORAGE_KEYS } from '@/lib/constants'

/** Page routes that redirect to /login when unauthenticated */
const PAGE_ROUTES = ['/dashboard', '/history', '/settings']

/** API routes that return 401 when unauthenticated */
const API_ROUTES = [
  '/api/auth/me',
  '/api/submissions',
  '/api/progress',
  '/api/users/settings',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPageRoute = PAGE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const isApiRoute = API_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  if (!isPageRoute && !isApiRoute) {
    return NextResponse.next()
  }

  // For page navigations: read token from cookie
  // For API calls: read token from Authorization header
  const cookieToken = request.cookies.get(STORAGE_KEYS.AUTH_TOKEN)?.value ?? null
  const headerToken = extractBearerToken(request.headers.get('authorization'))
  const token = headerToken ?? cookieToken

  const payload = token ? await verifyToken(token) : null

  // POST /api/submissions is allowed for guests (no token required),
  // but if a valid token IS present we still inject x-user-id so the
  // submission gets linked to the authenticated user.
  const isGuestAllowedRoute =
    pathname.startsWith('/api/submissions') && request.method === 'POST'

  if (!payload) {
    if (isGuestAllowedRoute) {
      // Guest POST — allow through without x-user-id
      return NextResponse.next()
    }
    if (isPageRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Forward userId to route handlers via request header
  const headers = new Headers(request.headers)
  headers.set('x-user-id', payload.sub as string)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/api/auth/me',
    '/api/submissions/:path*',
    '/api/submissions',
    '/api/progress',
    '/api/users/settings',
  ],
}
