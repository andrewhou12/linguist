import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'

export const GET = withAuth(async (_request, { userId }) => {
  const sessions = await prisma.conversationSession.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 20,
  })

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      timestamp: s.timestamp.toISOString(),
      durationSeconds: s.durationSeconds,
      sessionFocus: (s.sessionPlan as { sessionFocus?: string })?.sessionFocus ?? '',
    }))
  )
})
