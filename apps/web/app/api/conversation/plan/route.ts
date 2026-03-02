import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import Anthropic from '@anthropic-ai/sdk'
import { MasteryState } from '@lingle/shared/types'
import type { FsrsState, PragmaticState, WordBankEntry } from '@lingle/shared/types'
import type { Prisma } from '@prisma/client'
import {
  buildPlanningPrompt,
  buildConversationSystemPrompt,
  parseSessionPlan,
  type LearnerSummary,
} from '@lingle/core/conversation/planner'
import { generateExpandedDailyBrief, type ExpandedBriefInput } from '@lingle/core/tom/analyzer'
import { computeKnowledgeBubble, type BubbleItemInput } from '@lingle/core/curriculum/bubble'
import { generateRecommendations } from '@lingle/core/curriculum/recommender'

const anthropic = new Anthropic()

export const POST = withAuth(async (_request, { userId }) => {
  const profile = await prisma.learnerProfile.findUniqueOrThrow({ where: { userId } })

  // Build learner summary (same logic as desktop conversation.ts)
  const activeItems = await prisma.lexicalItem.findMany({
    where: {
      userId,
      masteryState: {
        in: [MasteryState.Apprentice1, MasteryState.Apprentice2, MasteryState.Apprentice3, MasteryState.Apprentice4, MasteryState.Journeyman],
      },
    },
  })

  const stableCount = await prisma.lexicalItem.count({
    where: { userId, masteryState: { in: [MasteryState.Expert, MasteryState.Master] } },
  })
  const burnedCount = await prisma.lexicalItem.count({
    where: { userId, masteryState: MasteryState.Burned },
  })

  let pragmaticState: PragmaticState | null = null
  const pragProfile = await prisma.pragmaticProfile.findUnique({ where: { userId } })
  if (pragProfile) {
    pragmaticState = {
      casualAccuracy: pragProfile.casualAccuracy, politeAccuracy: pragProfile.politeAccuracy,
      registerSlipCount: pragProfile.registerSlipCount, preferredRegister: pragProfile.preferredRegister,
      circumlocutionCount: pragProfile.circumlocutionCount, silenceEvents: pragProfile.silenceEvents,
      l1FallbackCount: pragProfile.l1FallbackCount, averageSpeakingPace: pragProfile.averageSpeakingPace,
      hesitationRate: pragProfile.hesitationRate, avoidedGrammarPatterns: pragProfile.avoidedGrammarPatterns,
      avoidedVocabIds: pragProfile.avoidedVocabIds,
    }
  }

  const allLexical = await prisma.lexicalItem.findMany({ where: { userId } })
  const allGrammar = await prisma.grammarItem.findMany({ where: { userId } })

  const bubbleItems: BubbleItemInput[] = [
    ...allLexical.map((i) => ({ id: i.id, itemType: 'lexical' as const, surfaceForm: i.surfaceForm, cefrLevel: i.cefrLevel, masteryState: i.masteryState, productionWeight: i.productionWeight })),
    ...allGrammar.map((i) => ({ id: i.id, itemType: 'grammar' as const, patternId: i.patternId, cefrLevel: i.cefrLevel, masteryState: i.masteryState, productionWeight: i.productionWeight })),
  ]
  const bubble = computeKnowledgeBubble(bubbleItems)

  const knownSurfaceForms = new Set(allLexical.map((i) => i.surfaceForm))
  const knownPatternIds = new Set(allGrammar.map((i) => i.patternId))
  const curriculumNewItems = generateRecommendations({ bubble, knownSurfaceForms, knownPatternIds, dailyNewItemLimit: 3, tomBriefInput: null })

  const wordBankEntries: WordBankEntry[] = activeItems.map((item) => ({
    id: item.id, surfaceForm: item.surfaceForm, reading: item.reading, meaning: item.meaning,
    partOfSpeech: item.partOfSpeech, masteryState: item.masteryState as MasteryState,
    recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
    productionFsrs: item.productionFsrs as unknown as FsrsState,
    firstSeen: item.firstSeen.toISOString(), lastReviewed: item.lastReviewed?.toISOString() ?? null,
    exposureCount: item.exposureCount, productionCount: item.productionCount,
    tags: item.tags, source: item.source,
  }))

  const learner: LearnerSummary = {
    targetLanguage: profile.targetLanguage, nativeLanguage: profile.nativeLanguage,
    computedLevel: profile.computedLevel, comprehensionCeiling: profile.comprehensionCeiling,
    productionCeiling: profile.productionCeiling, activeItems: wordBankEntries,
    stableItemCount: stableCount, burnedItemCount: burnedCount,
    modalityGap: bubble.levelBreakdowns.length > 0 ? `Production ceiling: ${profile.productionCeiling}, Comprehension ceiling: ${profile.comprehensionCeiling}` : null,
    pragmaticState, curriculumNewItems,
  }

  // Build ToM brief
  const lexicalWithReviews = await prisma.lexicalItem.findMany({
    where: { userId, masteryState: { not: 'unseen' } },
    include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
  })
  const grammarWithReviews = await prisma.grammarItem.findMany({
    where: { userId, masteryState: { not: 'unseen' } },
    include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
  })
  const totalSessionCount = await prisma.conversationSession.count({ where: { userId } })
  const recentErrors = await prisma.reviewEvent.findMany({
    where: { userId, grade: { in: ['again', 'hard'] } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  })

  const briefInput: ExpandedBriefInput = {
    items: [
      ...lexicalWithReviews.map((item) => ({
        itemId: item.id, masteryState: item.masteryState as ExpandedBriefInput['items'][number]['masteryState'],
        productionCount: item.productionCount, conversationProductionCount: item.speakingProductions + item.writingProductions,
        sessionsInCurrentState: Math.min(totalSessionCount, 10),
        recentGrades: item.reviewEvents.map((e) => e.grade as ExpandedBriefInput['items'][number]['recentGrades'][number]),
      })),
      ...grammarWithReviews.map((item) => ({
        itemId: item.id, masteryState: item.masteryState as ExpandedBriefInput['items'][number]['masteryState'],
        productionCount: 0, conversationProductionCount: item.speakingProductions + item.writingProductions,
        sessionsInCurrentState: Math.min(totalSessionCount, 10),
        recentGrades: item.reviewEvents.map((e) => e.grade as ExpandedBriefInput['items'][number]['recentGrades'][number]),
      })),
    ],
    errors: recentErrors.filter((e) => e.sessionId).map((e) => ({
      itemId: e.lexicalItemId ?? e.grammarItemId ?? 0, sessionId: e.sessionId!, errorType: e.grade,
    })),
    modalityData: [
      ...lexicalWithReviews.map((item) => ({
        itemId: item.id, recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
        productionFsrs: item.productionFsrs as unknown as FsrsState,
        readingExposures: item.readingExposures, listeningExposures: item.listeningExposures,
        speakingProductions: item.speakingProductions, writingProductions: item.writingProductions,
      })),
      ...grammarWithReviews.map((item) => ({
        itemId: item.id, recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
        productionFsrs: item.productionFsrs as unknown as FsrsState,
        readingExposures: item.readingExposures, listeningExposures: item.listeningExposures,
        speakingProductions: item.speakingProductions, writingProductions: item.writingProductions,
      })),
    ],
    grammarTransferData: grammarWithReviews.map((item) => ({
      itemId: item.id, patternId: item.patternId,
      masteryState: item.masteryState as ExpandedBriefInput['grammarTransferData'][number]['masteryState'],
      contextCount: item.contextCount,
    })),
    pragmaticState,
    recommendedDifficulty: 'A1',
  }

  const brief = generateExpandedDailyBrief(briefInput)

  // Call Claude for session plan
  const planningPrompt = buildPlanningPrompt(learner, brief)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: planningPrompt }],
  })
  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response from planning API')

  const plan = parseSessionPlan(textContent.text)
  const systemPrompt = buildConversationSystemPrompt(learner, plan, brief)

  // Create session in DB with systemPrompt stored
  const session = await prisma.conversationSession.create({
    data: {
      userId,
      transcript: [],
      targetsPlanned: { vocabulary: plan.targetVocabulary, grammar: plan.targetGrammar },
      targetsHit: [], errorsLogged: [], avoidanceEvents: [],
      sessionPlan: plan as unknown as Prisma.InputJsonValue,
      systemPrompt,
    },
  })

  await prisma.learnerProfile.update({
    where: { userId },
    data: { totalSessions: { increment: 1 } },
  })

  return NextResponse.json({ ...plan, _sessionId: session.id })
})
