import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import type { ExpandedLearnerProfile } from '@linguist/shared/types'

export const GET = withAuth(async (_request, { userId }) => {
  const profile = await prisma.learnerProfile.findUnique({ where: { userId } })
  if (!profile) {
    return NextResponse.json(null)
  }

  const result: ExpandedLearnerProfile = {
    id: profile.id,
    targetLanguage: profile.targetLanguage,
    nativeLanguage: profile.nativeLanguage,
    dailyNewItemLimit: profile.dailyNewItemLimit,
    targetRetention: profile.targetRetention,
    computedLevel: profile.computedLevel,
    comprehensionCeiling: profile.comprehensionCeiling,
    productionCeiling: profile.productionCeiling,
    readingLevel: profile.readingLevel,
    listeningLevel: profile.listeningLevel,
    speakingLevel: profile.speakingLevel,
    writingLevel: profile.writingLevel,
    totalSessions: profile.totalSessions,
    totalReviewEvents: profile.totalReviewEvents,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDate: profile.lastActiveDate?.toISOString() ?? null,
    errorPatternSummary: profile.errorPatternSummary as Record<string, unknown>,
    avoidancePatternSummary: profile.avoidancePatternSummary as Record<string, unknown>,
  }

  return NextResponse.json(result)
})

export const PATCH = withAuth(async (request, { userId }) => {
  const updates = await request.json()
  const profile = await prisma.learnerProfile.update({
    where: { userId },
    data: updates,
  })

  const result: ExpandedLearnerProfile = {
    id: profile.id,
    targetLanguage: profile.targetLanguage,
    nativeLanguage: profile.nativeLanguage,
    dailyNewItemLimit: profile.dailyNewItemLimit,
    targetRetention: profile.targetRetention,
    computedLevel: profile.computedLevel,
    comprehensionCeiling: profile.comprehensionCeiling,
    productionCeiling: profile.productionCeiling,
    readingLevel: profile.readingLevel,
    listeningLevel: profile.listeningLevel,
    speakingLevel: profile.speakingLevel,
    writingLevel: profile.writingLevel,
    totalSessions: profile.totalSessions,
    totalReviewEvents: profile.totalReviewEvents,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDate: profile.lastActiveDate?.toISOString() ?? null,
    errorPatternSummary: profile.errorPatternSummary as Record<string, unknown>,
    avoidancePatternSummary: profile.avoidancePatternSummary as Record<string, unknown>,
  }

  return NextResponse.json(result)
})
