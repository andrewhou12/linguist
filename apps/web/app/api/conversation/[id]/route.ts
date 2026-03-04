import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'

export const GET = withAuth(async (request, { userId }) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const session = await prisma.conversationSession.findFirst({
    where: { id, userId },
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: session.id,
    timestamp: session.timestamp.toISOString(),
    durationSeconds: session.durationSeconds,
    transcript: session.transcript,
    sessionPlan: session.sessionPlan,
    systemPrompt: session.systemPrompt,
  })
})
