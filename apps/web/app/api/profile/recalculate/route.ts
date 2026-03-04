import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'

export const POST = withAuth(async (_request, { userId }) => {
  const profile = await prisma.learnerProfile.update({
    where: { userId },
    data: { lastActiveDate: new Date() },
  })

  return NextResponse.json({
    id: profile.id,
    targetLanguage: profile.targetLanguage,
    nativeLanguage: profile.nativeLanguage,
    totalSessions: profile.totalSessions,
    lastActiveDate: profile.lastActiveDate?.toISOString() ?? null,
  })
})
