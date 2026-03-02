import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import { generateExpandedDailyBrief, type ExpandedBriefInput } from '@lingle/core/tom/analyzer'
import type { FsrsState, PragmaticState } from '@lingle/shared/types'

export const GET = withAuth(async (_request, { userId }) => {
  const lexicalItems = await prisma.lexicalItem.findMany({
    where: { userId, masteryState: { not: 'unseen' } },
    include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
  })
  const grammarItems = await prisma.grammarItem.findMany({
    where: { userId, masteryState: { not: 'unseen' } },
    include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
  })
  const conversationSessions = await prisma.conversationSession.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 50,
  })
  const totalSessionCount = conversationSessions.length
  const recentErrors = await prisma.reviewEvent.findMany({
    where: { userId, grade: { in: ['again', 'hard'] } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  })

  let pragmaticState: PragmaticState | null = null
  const pragProfile = await prisma.pragmaticProfile.findUnique({ where: { userId } })
  if (pragProfile) {
    pragmaticState = {
      casualAccuracy: pragProfile.casualAccuracy,
      politeAccuracy: pragProfile.politeAccuracy,
      registerSlipCount: pragProfile.registerSlipCount,
      preferredRegister: pragProfile.preferredRegister,
      circumlocutionCount: pragProfile.circumlocutionCount,
      silenceEvents: pragProfile.silenceEvents,
      l1FallbackCount: pragProfile.l1FallbackCount,
      averageSpeakingPace: pragProfile.averageSpeakingPace,
      hesitationRate: pragProfile.hesitationRate,
      avoidedGrammarPatterns: pragProfile.avoidedGrammarPatterns,
      avoidedVocabIds: pragProfile.avoidedVocabIds,
    }
  }

  const items = [
    ...lexicalItems.map((item) => ({
      itemId: item.id,
      masteryState: item.masteryState as ExpandedBriefInput['items'][number]['masteryState'],
      productionCount: item.productionCount,
      conversationProductionCount: item.speakingProductions + item.writingProductions,
      sessionsInCurrentState: Math.min(totalSessionCount, 10),
      recentGrades: item.reviewEvents.map(
        (e) => e.grade as ExpandedBriefInput['items'][number]['recentGrades'][number]
      ),
    })),
    ...grammarItems.map((item) => ({
      itemId: item.id,
      masteryState: item.masteryState as ExpandedBriefInput['items'][number]['masteryState'],
      productionCount: 0,
      conversationProductionCount: item.speakingProductions + item.writingProductions,
      sessionsInCurrentState: Math.min(totalSessionCount, 10),
      recentGrades: item.reviewEvents.map(
        (e) => e.grade as ExpandedBriefInput['items'][number]['recentGrades'][number]
      ),
    })),
  ]

  const errors = recentErrors
    .filter((e) => e.sessionId)
    .map((e) => ({
      itemId: e.lexicalItemId ?? e.grammarItemId ?? 0,
      sessionId: e.sessionId!,
      errorType: e.grade,
    }))

  const modalityData = [
    ...lexicalItems.map((item) => ({
      itemId: item.id,
      recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
      productionFsrs: item.productionFsrs as unknown as FsrsState,
      readingExposures: item.readingExposures,
      listeningExposures: item.listeningExposures,
      speakingProductions: item.speakingProductions,
      writingProductions: item.writingProductions,
    })),
    ...grammarItems.map((item) => ({
      itemId: item.id,
      recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
      productionFsrs: item.productionFsrs as unknown as FsrsState,
      readingExposures: item.readingExposures,
      listeningExposures: item.listeningExposures,
      speakingProductions: item.speakingProductions,
      writingProductions: item.writingProductions,
    })),
  ]

  const grammarTransferData = grammarItems.map((item) => ({
    itemId: item.id,
    patternId: item.patternId,
    masteryState: item.masteryState as ExpandedBriefInput['grammarTransferData'][number]['masteryState'],
    contextCount: item.contextCount,
  }))

  const brief = generateExpandedDailyBrief({
    items,
    errors,
    modalityData,
    grammarTransferData,
    pragmaticState,
    recommendedDifficulty: 'A1',
  })

  return NextResponse.json(brief)
})
