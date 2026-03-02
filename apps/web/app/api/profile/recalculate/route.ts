import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import { recalculateProfile } from '@lingle/core/profile/calculator'
import type { FsrsState } from '@lingle/shared/types'

export const POST = withAuth(async (_request, { userId }) => {
  const lexicalItems = await prisma.lexicalItem.findMany({
    where: { userId, masteryState: { not: 'unseen' } },
  })
  const grammarItems = await prisma.grammarItem.findMany({
    where: { userId, masteryState: { not: 'unseen' } },
  })

  const items = [
    ...lexicalItems.map((item) => ({
      id: item.id,
      itemType: 'lexical' as const,
      cefrLevel: item.cefrLevel,
      masteryState: item.masteryState,
      recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
      productionFsrs: item.productionFsrs as unknown as FsrsState,
      writingProductions: item.writingProductions,
      readingExposures: item.readingExposures,
      listeningExposures: item.listeningExposures,
      speakingProductions: item.speakingProductions,
    })),
    ...grammarItems.map((item) => ({
      id: item.id,
      itemType: 'grammar' as const,
      cefrLevel: item.cefrLevel,
      masteryState: item.masteryState,
      recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
      productionFsrs: item.productionFsrs as unknown as FsrsState,
      writingProductions: item.writingProductions,
      readingExposures: item.readingExposures,
      listeningExposures: item.listeningExposures,
      speakingProductions: item.speakingProductions,
    })),
  ]

  const profile = await prisma.learnerProfile.findUniqueOrThrow({ where: { userId } })
  const totalReviewEvents = await prisma.reviewEvent.count({ where: { userId } })

  const update = recalculateProfile({
    items,
    totalReviewEvents,
    lastActiveDate: new Date().toISOString(),
    previousStreak: profile.currentStreak,
    previousLongestStreak: profile.longestStreak,
    previousLastActiveDate: profile.lastActiveDate?.toISOString() ?? null,
  })

  const updated = await prisma.learnerProfile.update({
    where: { userId },
    data: { ...update, totalReviewEvents, lastActiveDate: new Date() },
  })

  return NextResponse.json({
    id: updated.id,
    targetLanguage: updated.targetLanguage,
    nativeLanguage: updated.nativeLanguage,
    dailyNewItemLimit: updated.dailyNewItemLimit,
    targetRetention: updated.targetRetention,
    computedLevel: updated.computedLevel,
    comprehensionCeiling: updated.comprehensionCeiling,
    productionCeiling: updated.productionCeiling,
    readingLevel: updated.readingLevel,
    listeningLevel: updated.listeningLevel,
    speakingLevel: updated.speakingLevel,
    writingLevel: updated.writingLevel,
    totalSessions: updated.totalSessions,
    totalReviewEvents: updated.totalReviewEvents,
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    lastActiveDate: updated.lastActiveDate?.toISOString() ?? null,
    errorPatternSummary: updated.errorPatternSummary as Record<string, unknown>,
    avoidancePatternSummary: updated.avoidancePatternSummary as Record<string, unknown>,
  })
})
