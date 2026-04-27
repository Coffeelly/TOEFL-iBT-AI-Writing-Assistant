import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { UserProfile } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      currentLevel: user.currentLevel as UserProfile['currentLevel'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.error('[GET /api/auth/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
