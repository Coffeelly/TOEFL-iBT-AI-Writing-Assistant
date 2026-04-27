import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { validate, ValidationError, loginSchema } from '@/lib/validators'
import type { UserProfile } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = validate(loginSchema, body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(data.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signToken(user.id, user.email)
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      currentLevel: user.currentLevel as UserProfile['currentLevel'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return NextResponse.json({ token, user: profile }, { status: 200 })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation error', details: err.details }, { status: 400 })
    }
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
