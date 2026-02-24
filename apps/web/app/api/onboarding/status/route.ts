import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'

export const GET = withAuth(async (_request, { userId }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return NextResponse.json({ completed: user?.onboardingCompleted ?? false })
})
