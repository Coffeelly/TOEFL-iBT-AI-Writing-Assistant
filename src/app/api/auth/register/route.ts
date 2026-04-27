import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { validate, ValidationError, registerSchema } from '@/lib/validators'
import type { UserProfile } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = validate(registerSchema, body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, displayName: data.displayName },
    })

    const token = await signToken(user.id, user.email)
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      currentLevel: user.currentLevel as UserProfile['currentLevel'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return NextResponse.json({ token, user: profile }, { status: 201 })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation error', details: err.details }, { status: 400 })
    }
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
