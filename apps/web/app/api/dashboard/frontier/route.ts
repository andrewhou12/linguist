import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import { computeKnowledgeBubble, type BubbleItemInput } from '@lingle/core/curriculum/bubble'

export const GET = withAuth(async (_request, { userId }) => {
  const profile = await prisma.learnerProfile.findUnique({ where: { userId } })
  if (!profile) return NextResponse.json(null)

  const allLexical = await prisma.lexicalItem.findMany({ where: { userId } })
  const allGrammar = await prisma.grammarItem.findMany({ where: { userId } })

  const bubbleItems: BubbleItemInput[] = [
    ...allLexical.map((i) => ({
      id: i.id,
      itemType: 'lexical' as const,
      surfaceForm: i.surfaceForm,
      cefrLevel: i.cefrLevel,
      masteryState: i.masteryState,
      productionWeight: i.productionWeight,
    })),
    ...allGrammar.map((i) => ({
      id: i.id,
      itemType: 'grammar' as const,
      patternId: i.patternId,
      cefrLevel: i.cefrLevel,
      masteryState: i.masteryState,
      productionWeight: i.productionWeight,
    })),
  ]

  const bubble = computeKnowledgeBubble(bubbleItems)

  const items = bubbleItems.map((item) => ({
    id: item.id,
    itemType: item.itemType,
    surfaceForm: 'surfaceForm' in item ? item.surfaceForm : undefined,
    patternId: 'patternId' in item ? item.patternId : undefined,
    cefrLevel: item.cefrLevel,
    masteryState: item.masteryState,
  }))

  const masteryDistribution: Record<string, number> = {}
  for (const item of items) {
    masteryDistribution[item.masteryState] = (masteryDistribution[item.masteryState] ?? 0) + 1
  }

  return NextResponse.json({
    bubble,
    profile: {
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
    },
    items,
    masteryDistribution,
  })
})
