// Feature: toefl-helper-local
// Unit tests for auth API routes
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PrismaClient } from '../../../src/generated/prisma/client'
import { POST as registerPOST } from '../../../src/app/api/auth/register/route'
import { POST as loginPOST } from '../../../src/app/api/auth/login/route'
import { GET as meGET } from '../../../src/app/api/auth/me/route'
import { signToken } from '../../../src/lib/auth'

// ---------------------------------------------------------------------------
// Prisma client for test setup / teardown
// ---------------------------------------------------------------------------

const prisma = new PrismaClient()

// Track created user emails for cleanup
const createdEmails: string[] = []

afterAll(async () => {
  if (createdEmails.length > 0) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } })
  }
  await prisma.$disconnect()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRegisterRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeLoginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeMeRequest(userId?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (userId) {
    headers['x-user-id'] = userId
  }
  return new NextRequest('http://localhost/api/auth/me', {
    method: 'GET',
    headers,
  })
}

/** Generate a unique test email to avoid collisions between test runs */
function uniqueEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe('POST /api/auth/register', () => {
  it('returns 201 with token and user profile for valid registration', async () => {
    const email = uniqueEmail('register-valid')
    createdEmails.push(email)

    const req = makeRegisterRequest({
      email,
      password: 'securepassword123',
      displayName: 'Test User',
    })

    const res = await registerPOST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body).toHaveProperty('token')
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(0)

    expect(body).toHaveProperty('user')
    expect(body.user.email).toBe(email)
    expect(body.user.displayName).toBe('Test User')
    expect(body.user).toHaveProperty('id')
    expect(body.user).toHaveProperty('currentLevel')
    // Password hash must never be exposed
    expect(body.user).not.toHaveProperty('passwordHash')
  })

  it('returns 409 when email is already registered', async () => {
    const email = uniqueEmail('register-dup')
    createdEmails.push(email)

    const validBody = {
      email,
      password: 'securepassword123',
      displayName: 'First User',
    }

    // First registration — should succeed
    const firstRes = await registerPOST(makeRegisterRequest(validBody))
    expect(firstRes.status).toBe(201)

    // Second registration with same email — should conflict
    const secondRes = await registerPOST(
      makeRegisterRequest({ ...validBody, displayName: 'Second User' }),
    )
    expect(secondRes.status).toBe(409)

    const body = await secondRes.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toMatch(/already registered/i)
  })

  it('returns 400 when password is shorter than 8 characters', async () => {
    const req = makeRegisterRequest({
      email: uniqueEmail('register-short-pw'),
      password: 'short',
      displayName: 'Test User',
    })

    const res = await registerPOST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body).toHaveProperty('error')
    // Should include validation details
    expect(body).toHaveProperty('details')
  })

  it('returns 400 when email format is invalid', async () => {
    const req = makeRegisterRequest({
      email: 'not-an-email',
      password: 'securepassword123',
      displayName: 'Test User',
    })

    const res = await registerPOST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('details')
  })

  it('returns 400 when displayName is missing', async () => {
    const req = makeRegisterRequest({
      email: uniqueEmail('register-no-name'),
      password: 'securepassword123',
    })

    const res = await registerPOST(req)
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  // Seed a user once for login tests
  let loginEmail: string
  const loginPassword = 'loginpassword99'

  beforeAll(async () => {
    loginEmail = uniqueEmail('login-user')
    createdEmails.push(loginEmail)

    const req = makeRegisterRequest({
      email: loginEmail,
      password: loginPassword,
      displayName: 'Login Test User',
    })
    const res = await registerPOST(req)
    expect(res.status).toBe(201)
  })

  it('returns 200 with token and user profile for correct credentials', async () => {
    const req = makeLoginRequest({ email: loginEmail, password: loginPassword })
    const res = await loginPOST(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('token')
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(0)

    expect(body).toHaveProperty('user')
    expect(body.user.email).toBe(loginEmail)
    expect(body.user).not.toHaveProperty('passwordHash')
  })

  it('returns 401 for wrong password', async () => {
    const req = makeLoginRequest({ email: loginEmail, password: 'wrongpassword' })
    const res = await loginPOST(req)
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body).toHaveProperty('error')
    // Must not distinguish between wrong password and non-existent email
    expect(body.error).toMatch(/invalid credentials/i)
  })

  it('returns 401 for non-existent email', async () => {
    const req = makeLoginRequest({
      email: 'nobody@example.com',
      password: 'somepassword123',
    })
    const res = await loginPOST(req)
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toMatch(/invalid credentials/i)
  })

  it('returns 400 for missing password field', async () => {
    const req = makeLoginRequest({ email: loginEmail })
    const res = await loginPOST(req)
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

describe('GET /api/auth/me', () => {
  let meUserId: string
  let meEmail: string

  beforeAll(async () => {
    meEmail = uniqueEmail('me-user')
    createdEmails.push(meEmail)

    const req = makeRegisterRequest({
      email: meEmail,
      password: 'mepassword123',
      displayName: 'Me Test User',
    })
    const res = await registerPOST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    meUserId = body.user.id
  })

  it('returns 401 when no x-user-id header is present', async () => {
    const req = makeMeRequest()
    const res = await meGET(req)
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('returns 200 with user profile when x-user-id header is valid', async () => {
    const req = makeMeRequest(meUserId)
    const res = await meGET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe(meUserId)
    expect(body.email).toBe(meEmail)
    expect(body.displayName).toBe('Me Test User')
    expect(body).not.toHaveProperty('passwordHash')
  })

  it('returns 404 when x-user-id does not match any user', async () => {
    const req = makeMeRequest('nonexistent-user-id-xyz')
    const res = await meGET(req)
    expect(res.status).toBe(404)
  })
})
