import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'

export const POST = withAuth(async (request, { userId: _userId }) => {
  const { sessionId } = await request.json()

  const dbSession = await prisma.conversationSession.findUnique({ where: { id: sessionId } })
  if (!dbSession) return NextResponse.json(null)

  const duration = Math.floor((Date.now() - dbSession.timestamp.getTime()) / 1000)
  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: { durationSeconds: duration },
  })

  return NextResponse.json(null)
})
