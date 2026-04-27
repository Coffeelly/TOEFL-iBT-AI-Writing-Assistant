// =============================================================================
// PUT /api/users/settings
// =============================================================================
// Updates the authenticated user's display name and/or difficulty level.
// Requirements: 7.7, 7.8, 11.6
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validate, updateSettingsSchema } from '@/lib/validators'
import { ValidationError } from '@/lib/validators'
import type { UserProfile } from '@/types'

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    let data: { displayName?: string; currentLevel?: UserProfile['currentLevel'] }
    try {
      const result = validate(updateSettingsSchema, body)
      data = result.data
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json(
          { error: 'Validation error', details: err.details },
          { status: 400 },
        )
      }
      throw err
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.currentLevel !== undefined && { currentLevel: data.currentLevel }),
      },
    })

    const profile: UserProfile = {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      currentLevel: updated.currentLevel as UserProfile['currentLevel'],
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.error('[PUT /api/users/settings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
