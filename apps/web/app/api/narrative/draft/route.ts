import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { buildNarrativeDraft } from '@lingle/core/narrative/draft'

export const POST = withAuth(async (request) => {
  const { frontier, brief } = await request.json()
  const draft = buildNarrativeDraft(frontier, brief)
  return NextResponse.json(draft)
})
