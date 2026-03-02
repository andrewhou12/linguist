import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import { generateExpandedDailyBrief, type ExpandedBriefInput } from '@lingle/core/tom/analyzer'
import type { FsrsState, PragmaticState } from '@lingle/shared/types'

export const POST = withAuth(async (_request, { userId }) => {
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

  const briefInput: ExpandedBriefInput = {
    items: [
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
    ],
    errors: recentErrors.filter((e) => e.sessionId).map((e) => ({
      itemId: e.lexicalItemId ?? e.grammarItemId ?? 0,
      sessionId: e.sessionId!,
      errorType: e.grade,
    })),
    modalityData: [
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
    ],
    grammarTransferData: grammarItems.map((item) => ({
      itemId: item.id,
      patternId: item.patternId,
      masteryState: item.masteryState as ExpandedBriefInput['grammarTransferData'][number]['masteryState'],
      contextCount: item.contextCount,
    })),
    pragmaticState,
    recommendedDifficulty: 'A1',
  }

  const brief = generateExpandedDailyBrief(briefInput)

  // Clear old inferences and create new ones
  await prisma.tomInference.updateMany({
    where: { userId, resolved: false },
    data: { resolved: true },
  })

  for (const avoidance of brief.avoidancePatterns) {
    await prisma.tomInference.create({
      data: { userId, type: 'avoidance', itemIds: [avoidance.itemId], confidence: 0.7, description: `Item avoided for ${avoidance.sessionsAvoided} sessions` },
    })
  }
  for (const pair of brief.confusionPairs) {
    await prisma.tomInference.create({
      data: { userId, type: 'confusion_pair', itemIds: pair.itemIds, confidence: 0.6, description: pair.description },
    })
  }
  for (const regression of brief.regressions) {
    await prisma.tomInference.create({
      data: { userId, type: 'regression', itemIds: [regression.itemId], confidence: 0.8, description: `Regression: recent grades ${regression.recentGrades.join(', ')}` },
    })
  }
  for (const gap of brief.modalityGaps) {
    await prisma.tomInference.create({
      data: { userId, type: 'modality_gap', itemIds: [], confidence: 0.75, description: `${gap.modality} modality gap: ${gap.currentLevel} vs strongest ${gap.strongestLevel}` },
    })
  }
  for (const transfer of brief.transferGaps) {
    await prisma.tomInference.create({
      data: { userId, type: 'transfer_gap', itemIds: [transfer.itemId], confidence: 0.65, description: `Grammar pattern ${transfer.patternId} needs novel context (${transfer.contextCount}/${transfer.needed})` },
    })
  }

  return NextResponse.json({ success: true })
})
