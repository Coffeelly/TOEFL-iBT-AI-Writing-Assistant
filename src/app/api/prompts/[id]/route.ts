// =============================================================================
// GET /api/prompts/[id]
// =============================================================================
// Returns the full prompt record for the given id, or 404 if not found.
// Requirements: 5.4, 5.5
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const prompt = await prisma.prompt.findUnique({ where: { id } })

    if (!prompt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ prompt })
  } catch (err) {
    console.error('[GET /api/prompts/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
