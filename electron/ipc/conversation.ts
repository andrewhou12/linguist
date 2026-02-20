import { ipcMain } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { IPC_CHANNELS } from '@shared/types'
import type {
  ConversationMessage,
  ExpandedSessionPlan,
  PostSessionAnalysis,
  FsrsState,
  PragmaticState,
  WordBankEntry,
} from '@shared/types'
import type { Prisma } from '@prisma/client'
import { MasteryState } from '@shared/types'
import { getDb } from '../db'
import {
  buildPlanningPrompt,
  buildConversationSystemPrompt,
  parseSessionPlan,
  type LearnerSummary,
} from '@core/conversation/planner'
import { buildAnalysisPrompt, parseAnalysis } from '@core/conversation/analyzer'
import { generateExpandedDailyBrief, type ExpandedBriefInput } from '@core/tom/analyzer'
import {
  buildPragmaticAnalysisPrompt,
  parsePragmaticAnalysis,
  updatePragmaticState,
} from '@core/pragmatics/analyzer'
import { generateRecommendations } from '@core/curriculum/recommender'
import { computeKnowledgeBubble, type BubbleItemInput } from '@core/curriculum/bubble'
import { createInitialFsrsState } from '@core/fsrs/scheduler'
import { recalculateProfile, type ProfileItemInput } from '@core/profile/calculator'

const anthropic = new Anthropic()

// Track active conversation sessions
const activeSessions = new Map<
  string,
  {
    plan: ExpandedSessionPlan
    systemPrompt: string
    messages: ConversationMessage[]
  }
>()

async function buildLearnerSummary(): Promise<LearnerSummary> {
  const db = getDb()
  const profile = await db.learnerProfile.findUniqueOrThrow({ where: { id: 1 } })

  const activeItems = await db.lexicalItem.findMany({
    where: {
      masteryState: {
        in: [
          MasteryState.Apprentice1,
          MasteryState.Apprentice2,
          MasteryState.Apprentice3,
          MasteryState.Apprentice4,
          MasteryState.Journeyman,
        ],
      },
    },
  })

  const stableCount = await db.lexicalItem.count({
    where: { masteryState: { in: [MasteryState.Expert, MasteryState.Master] } },
  })
  const burnedCount = await db.lexicalItem.count({
    where: { masteryState: MasteryState.Burned },
  })

  // Get pragmatic state
  let pragmaticState: PragmaticState | null = null
  const pragProfile = await db.pragmaticProfile.findUnique({ where: { id: 1 } })
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

  // Get curriculum recommendations
  const allLexical = await db.lexicalItem.findMany()
  const allGrammar = await db.grammarItem.findMany()
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

  const knownSurfaceForms = new Set(allLexical.map((i) => i.surfaceForm))
  const knownPatternIds = new Set(allGrammar.map((i) => i.patternId))

  const curriculumNewItems = generateRecommendations({
    bubble,
    knownSurfaceForms,
    knownPatternIds,
    dailyNewItemLimit: 3,
    tomBriefInput: null,
  })

  // Modality gap detection
  const modalityGapDescription =
    bubble.levelBreakdowns.length > 0
      ? `Production ceiling: ${profile.productionCeiling}, Comprehension ceiling: ${profile.comprehensionCeiling}`
      : null

  const wordBankEntries: WordBankEntry[] = activeItems.map((item) => ({
    id: item.id,
    surfaceForm: item.surfaceForm,
    reading: item.reading,
    meaning: item.meaning,
    partOfSpeech: item.partOfSpeech,
    masteryState: item.masteryState as MasteryState,
    recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
    productionFsrs: item.productionFsrs as unknown as FsrsState,
    firstSeen: item.firstSeen.toISOString(),
    lastReviewed: item.lastReviewed?.toISOString() ?? null,
    exposureCount: item.exposureCount,
    productionCount: item.productionCount,
    tags: item.tags,
    source: item.source,
  }))

  return {
    targetLanguage: profile.targetLanguage,
    nativeLanguage: profile.nativeLanguage,
    computedLevel: profile.computedLevel,
    comprehensionCeiling: profile.comprehensionCeiling,
    productionCeiling: profile.productionCeiling,
    activeItems: wordBankEntries,
    stableItemCount: stableCount,
    burnedItemCount: burnedCount,
    modalityGap: modalityGapDescription,
    pragmaticState,
    curriculumNewItems,
  }
}

async function buildExpandedTomBrief(): Promise<ReturnType<typeof generateExpandedDailyBrief>> {
  const db = getDb()

  const lexicalItems = await db.lexicalItem.findMany({
    where: { masteryState: { not: 'unseen' } },
    include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
  })
  const grammarItems = await db.grammarItem.findMany({
    where: { masteryState: { not: 'unseen' } },
    include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
  })

  const conversationSessions = await db.conversationSession.findMany({
    orderBy: { timestamp: 'desc' },
    take: 50,
  })
  const totalSessionCount = conversationSessions.length

  const recentErrors = await db.reviewEvent.findMany({
    where: { grade: { in: ['again', 'hard'] } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  })

  let pragmaticState: PragmaticState | null = null
  const pragProfile = await db.pragmaticProfile.findUnique({ where: { id: 1 } })
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
    errors: recentErrors
      .filter((e) => e.sessionId)
      .map((e) => ({
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

  return generateExpandedDailyBrief(briefInput)
}

export function registerConversationHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_PLAN,
    async (): Promise<ExpandedSessionPlan> => {
      const learner = await buildLearnerSummary()
      const brief = await buildExpandedTomBrief()

      const planningPrompt = buildPlanningPrompt(learner, brief)

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: planningPrompt }],
      })

      const textContent = response.content.find((c) => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from planning API')
      }

      const plan = parseSessionPlan(textContent.text)
      const db = getDb()

      // Create conversation session
      const session = await db.conversationSession.create({
        data: {
          transcript: [],
          targetsPlanned: {
            vocabulary: plan.targetVocabulary,
            grammar: plan.targetGrammar,
          },
          targetsHit: [],
          errorsLogged: [],
          avoidanceEvents: [],
          sessionPlan: plan as unknown as Prisma.InputJsonValue,
        },
      })

      const systemPrompt = buildConversationSystemPrompt(learner, plan, brief)

      activeSessions.set(session.id, {
        plan,
        systemPrompt,
        messages: [],
      })

      // Increment total sessions
      await db.learnerProfile.update({
        where: { id: 1 },
        data: { totalSessions: { increment: 1 } },
      })

      return { ...plan, _sessionId: session.id } as ExpandedSessionPlan & { _sessionId: string }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_SEND,
    async (
      _event,
      sessionId: string,
      message: string
    ): Promise<ConversationMessage> => {
      const session = activeSessions.get(sessionId)
      if (!session) {
        throw new Error(`No active session: ${sessionId}`)
      }

      // Add user message
      const userMsg: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      }
      session.messages.push(userMsg)

      // Build API messages (keep last 30 turns)
      const recentMessages = session.messages.slice(-30)
      const apiMessages = recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: session.systemPrompt,
        messages: apiMessages,
      })

      const textContent = response.content.find((c) => c.type === 'text')
      const assistantContent = textContent?.type === 'text' ? textContent.text : ''

      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      }
      session.messages.push(assistantMsg)

      // Update transcript in DB
      const db = getDb()
      await db.conversationSession.update({
        where: { id: sessionId },
        data: { transcript: session.messages as unknown as Prisma.InputJsonValue },
      })

      return assistantMsg
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_END,
    async (_event, sessionId: string): Promise<PostSessionAnalysis | null> => {
      const db = getDb()
      const session = activeSessions.get(sessionId)

      // Update session duration
      const dbSession = await db.conversationSession.findUnique({
        where: { id: sessionId },
      })

      if (dbSession) {
        const duration = Math.floor(
          (Date.now() - dbSession.timestamp.getTime()) / 1000
        )
        await db.conversationSession.update({
          where: { id: sessionId },
          data: { durationSeconds: duration },
        })
      }

      if (!session || session.messages.length === 0) {
        activeSessions.delete(sessionId)
        return null
      }

      let result: PostSessionAnalysis | null = null

      // Run post-session analysis
      const analysisPrompt = buildAnalysisPrompt(session.messages, session.plan)
      const analysisResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: analysisPrompt }],
      })

      const analysisText = analysisResponse.content.find((c) => c.type === 'text')
      if (analysisText?.type === 'text') {
        const analysis = parseAnalysis(analysisText.text)

        result = {
          targetsHit: analysis.targetsHit,
          errorsLogged: analysis.errorsLogged,
          avoidanceEvents: analysis.avoidanceEvents,
          newItemsEncountered: analysis.newItemsEncountered,
          overallAssessment: analysis.overallAssessment,
        }

        // Update conversation session with analysis results
        await db.conversationSession.update({
          where: { id: sessionId },
          data: {
            targetsHit: analysis.targetsHit,
            errorsLogged: analysis.errorsLogged as unknown as Prisma.InputJsonValue,
            avoidanceEvents: analysis.avoidanceEvents as unknown as Prisma.InputJsonValue,
          },
        })

        // Create ItemContextLog entries for each context log
        for (const log of analysis.contextLogs) {
          await db.itemContextLog.create({
            data: {
              contextType: 'conversation',
              modality: log.modality,
              wasProduction: log.wasProduction,
              wasSuccessful: log.wasSuccessful,
              sessionId,
              lexicalItemId: log.itemType === 'lexical' ? log.itemId : null,
              grammarItemId: log.itemType === 'grammar' ? log.itemId : null,
            },
          })

          // Update item modality counters and context types
          if (log.itemType === 'lexical') {
            const item = await db.lexicalItem.findUnique({ where: { id: log.itemId } })
            if (item) {
              const updatedContextTypes = item.contextTypes.includes('conversation')
                ? item.contextTypes
                : [...item.contextTypes, 'conversation']

              const modalityUpdates: Record<string, { increment: number }> = {}
              if (log.modality === 'reading') modalityUpdates.readingExposures = { increment: 1 }
              if (log.modality === 'writing') modalityUpdates.writingProductions = { increment: 1 }
              if (log.modality === 'speaking') modalityUpdates.speakingProductions = { increment: 1 }
              if (log.modality === 'listening') modalityUpdates.listeningExposures = { increment: 1 }

              await db.lexicalItem.update({
                where: { id: log.itemId },
                data: {
                  contextTypes: updatedContextTypes,
                  contextCount: updatedContextTypes.length,
                  ...modalityUpdates,
                  ...(log.wasProduction
                    ? {
                        productionCount: { increment: 1 },
                        productionWeight: { increment: 1.0 },
                      }
                    : { exposureCount: { increment: 1 } }),
                },
              })
            }
          } else {
            const item = await db.grammarItem.findUnique({ where: { id: log.itemId } })
            if (item) {
              const updatedContextTypes = item.contextTypes.includes('conversation')
                ? item.contextTypes
                : [...item.contextTypes, 'conversation']
              const isNovel = !item.contextTypes.includes('conversation') && item.contextTypes.length > 0

              const modalityUpdates: Record<string, { increment: number }> = {}
              if (log.modality === 'reading') modalityUpdates.readingExposures = { increment: 1 }
              if (log.modality === 'writing') modalityUpdates.writingProductions = { increment: 1 }
              if (log.modality === 'speaking') modalityUpdates.speakingProductions = { increment: 1 }
              if (log.modality === 'listening') modalityUpdates.listeningExposures = { increment: 1 }

              await db.grammarItem.update({
                where: { id: log.itemId },
                data: {
                  contextTypes: updatedContextTypes,
                  contextCount: updatedContextTypes.length,
                  ...modalityUpdates,
                  ...(isNovel ? { novelContextCount: { increment: 1 } } : {}),
                  ...(log.wasProduction
                    ? { productionWeight: { increment: 1.0 } }
                    : {}),
                },
              })
            }
          }
        }

        // Add newly encountered items to lexical_items as "introduced"
        for (const newItem of analysis.newItemsEncountered) {
          const existing = await db.lexicalItem.findFirst({
            where: { surfaceForm: newItem.surfaceForm },
          })
          if (!existing) {
            const initialFsrs = createInitialFsrsState()
            await db.lexicalItem.create({
              data: {
                surfaceForm: newItem.surfaceForm,
                meaning: '',
                masteryState: 'introduced',
                recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
                productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
                source: 'conversation',
                tags: ['conversation'],
                contextTypes: ['conversation'],
                contextCount: 1,
              },
            })
          }
        }

        // Run pragmatic analysis
        const profile = await db.learnerProfile.findUniqueOrThrow({ where: { id: 1 } })
        const pragmaticPrompt = buildPragmaticAnalysisPrompt({
          transcript: session.messages,
          targetRegister: session.plan.pragmaticTargets.targetRegister,
          targetLanguage: profile.targetLanguage,
          nativeLanguage: profile.nativeLanguage,
        })

        const pragmaticResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: pragmaticPrompt }],
        })

        const pragmaticText = pragmaticResponse.content.find((c) => c.type === 'text')
        if (pragmaticText?.type === 'text') {
          const pragResult = parsePragmaticAnalysis(pragmaticText.text)

          // Update pragmatic profile
          const currentPrag = await db.pragmaticProfile.findUnique({ where: { id: 1 } })
          const currentState: PragmaticState = currentPrag
            ? {
                casualAccuracy: currentPrag.casualAccuracy,
                politeAccuracy: currentPrag.politeAccuracy,
                registerSlipCount: currentPrag.registerSlipCount,
                preferredRegister: currentPrag.preferredRegister,
                circumlocutionCount: currentPrag.circumlocutionCount,
                silenceEvents: currentPrag.silenceEvents,
                l1FallbackCount: currentPrag.l1FallbackCount,
                averageSpeakingPace: currentPrag.averageSpeakingPace,
                hesitationRate: currentPrag.hesitationRate,
                avoidedGrammarPatterns: currentPrag.avoidedGrammarPatterns,
                avoidedVocabIds: currentPrag.avoidedVocabIds,
              }
            : {
                casualAccuracy: 0,
                politeAccuracy: 0,
                registerSlipCount: 0,
                preferredRegister: 'polite',
                circumlocutionCount: 0,
                silenceEvents: 0,
                l1FallbackCount: 0,
                averageSpeakingPace: null,
                hesitationRate: null,
                avoidedGrammarPatterns: [],
                avoidedVocabIds: [],
              }

          const updatedState = updatePragmaticState(currentState, pragResult)

          await db.pragmaticProfile.upsert({
            where: { id: 1 },
            create: {
              id: 1,
              ...updatedState,
            },
            update: updatedState,
          })
        }

        // Trigger profile recalculation
        await triggerProfileRecalculation()
      }

      activeSessions.delete(sessionId)
      return result
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_LIST,
    async (): Promise<
      Array<{ id: string; timestamp: string; durationSeconds: number | null; sessionFocus: string }>
    > => {
      const db = getDb()
      const sessions = await db.conversationSession.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
      })

      return sessions.map((s) => ({
        id: s.id,
        timestamp: s.timestamp.toISOString(),
        durationSeconds: s.durationSeconds,
        sessionFocus: (s.sessionPlan as { sessionFocus?: string })?.sessionFocus ?? '',
      }))
    }
  )
}

async function triggerProfileRecalculation(): Promise<void> {
  const db = getDb()

  const lexicalItems = await db.lexicalItem.findMany({
    where: { masteryState: { not: 'unseen' } },
  })
  const grammarItems = await db.grammarItem.findMany({
    where: { masteryState: { not: 'unseen' } },
  })

  const items: ProfileItemInput[] = [
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

  const profile = await db.learnerProfile.findUniqueOrThrow({ where: { id: 1 } })
  const totalReviewEvents = await db.reviewEvent.count()

  const update = recalculateProfile({
    items,
    totalReviewEvents,
    lastActiveDate: new Date().toISOString(),
    previousStreak: profile.currentStreak,
    previousLongestStreak: profile.longestStreak,
    previousLastActiveDate: profile.lastActiveDate?.toISOString() ?? null,
  })

  await db.learnerProfile.update({
    where: { id: 1 },
    data: {
      ...update,
      totalReviewEvents,
      lastActiveDate: new Date(),
    },
  })
}
