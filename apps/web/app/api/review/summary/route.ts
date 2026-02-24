import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'

export const GET = withAuth(async (_request, { userId }) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayReviews = await prisma.reviewEvent.findMany({
    where: { userId, timestamp: { gte: today } },
  })

  const correctCount = todayReviews.filter(
    (r) => r.grade === 'good' || r.grade === 'easy'
  ).length

  const accuracy = todayReviews.length > 0 ? correctCount / todayReviews.length : 0

  return NextResponse.json({
    totalReviewed: todayReviews.length,
    accuracy,
    newItemsAdded: 0,
    masteryChanges: [],
  })
})
