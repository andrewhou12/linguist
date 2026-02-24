import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'

export const GET = withAuth(async (_request, { userId }) => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  const weeklyReviews = await prisma.reviewEvent.findMany({
    where: { userId, timestamp: { gte: weekAgo } },
  })

  const correctCount = weeklyReviews.filter(
    (r) => r.grade === 'good' || r.grade === 'easy'
  ).length
  const accuracyThisWeek = weeklyReviews.length > 0 ? correctCount / weeklyReviews.length : 0

  const weeklySessions = await prisma.conversationSession.count({
    where: { userId, timestamp: { gte: weekAgo } },
  })

  const itemsLearned = await prisma.lexicalItem.count({
    where: {
      userId,
      lastReviewed: { gte: weekAgo },
      masteryState: { notIn: ['unseen', 'introduced'] },
    },
  })

  const profile = await prisma.learnerProfile.findUnique({ where: { userId } })

  return NextResponse.json({
    reviewsThisWeek: weeklyReviews.length,
    accuracyThisWeek,
    sessionsThisWeek: weeklySessions,
    currentStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    itemsLearned,
  })
})
