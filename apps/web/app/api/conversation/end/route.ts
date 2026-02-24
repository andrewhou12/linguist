import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import Anthropic from '@anthropic-ai/sdk'
import type { ConversationMessage, ExpandedSessionPlan, PragmaticState, FsrsState } from '@linguist/shared/types'
import type { Prisma } from '@prisma/client'
import { buildAnalysisPrompt, parseAnalysis } from '@linguist/core/conversation/analyzer'
import { buildPragmaticAnalysisPrompt, parsePragmaticAnalysis, updatePragmaticState } from '@linguist/core/pragmatics/analyzer'
import { createInitialFsrsState } from '@linguist/core/fsrs/scheduler'
import { recalculateProfile } from '@linguist/core/profile/calculator'

const anthropic = new Anthropic()

export const POST = withAuth(async (request, { userId }) => {
  const { sessionId } = await request.json()

  const dbSession = await prisma.conversationSession.findUnique({ where: { id: sessionId } })
  if (!dbSession) return NextResponse.json(null)

  const duration = Math.floor((Date.now() - dbSession.timestamp.getTime()) / 1000)
  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: { durationSeconds: duration },
  })

  const transcript = (dbSession.transcript as unknown as ConversationMessage[]) ?? []
  if (transcript.length === 0) return NextResponse.json(null)

  const plan = dbSession.sessionPlan as unknown as ExpandedSessionPlan

  // Post-session analysis
  const analysisPrompt = buildAnalysisPrompt(transcript, plan)
  const analysisResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: analysisPrompt }],
  })

  const analysisText = analysisResponse.content.find((c) => c.type === 'text')
  if (!analysisText || analysisText.type !== 'text') return NextResponse.json(null)

  const analysis = parseAnalysis(analysisText.text)

  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: {
      targetsHit: analysis.targetsHit,
      errorsLogged: analysis.errorsLogged as unknown as Prisma.InputJsonValue,
      avoidanceEvents: analysis.avoidanceEvents as unknown as Prisma.InputJsonValue,
    },
  })

  // Log context entries and update items
  for (const ctxLog of analysis.contextLogs) {
    await prisma.itemContextLog.create({
      data: {
        userId, contextType: 'conversation', modality: ctxLog.modality,
        wasProduction: ctxLog.wasProduction, wasSuccessful: ctxLog.wasSuccessful,
        sessionId,
        lexicalItemId: ctxLog.itemType === 'lexical' ? ctxLog.itemId : null,
        grammarItemId: ctxLog.itemType === 'grammar' ? ctxLog.itemId : null,
      },
    })

    if (ctxLog.itemType === 'lexical') {
      const item = await prisma.lexicalItem.findUnique({ where: { id: ctxLog.itemId } })
      if (item) {
        const updatedContextTypes = item.contextTypes.includes('conversation') ? item.contextTypes : [...item.contextTypes, 'conversation']
        const modalityUpdates: Record<string, { increment: number }> = {}
        if (ctxLog.modality === 'reading') modalityUpdates.readingExposures = { increment: 1 }
        if (ctxLog.modality === 'writing') modalityUpdates.writingProductions = { increment: 1 }
        if (ctxLog.modality === 'speaking') modalityUpdates.speakingProductions = { increment: 1 }
        if (ctxLog.modality === 'listening') modalityUpdates.listeningExposures = { increment: 1 }
        await prisma.lexicalItem.update({
          where: { id: ctxLog.itemId },
          data: {
            contextTypes: updatedContextTypes, contextCount: updatedContextTypes.length,
            ...modalityUpdates,
            ...(ctxLog.wasProduction ? { productionCount: { increment: 1 }, productionWeight: { increment: 1.0 } } : { exposureCount: { increment: 1 } }),
          },
        })
      }
    } else {
      const item = await prisma.grammarItem.findUnique({ where: { id: ctxLog.itemId } })
      if (item) {
        const updatedContextTypes = item.contextTypes.includes('conversation') ? item.contextTypes : [...item.contextTypes, 'conversation']
        const isNovel = !item.contextTypes.includes('conversation') && item.contextTypes.length > 0
        const modalityUpdates: Record<string, { increment: number }> = {}
        if (ctxLog.modality === 'reading') modalityUpdates.readingExposures = { increment: 1 }
        if (ctxLog.modality === 'writing') modalityUpdates.writingProductions = { increment: 1 }
        if (ctxLog.modality === 'speaking') modalityUpdates.speakingProductions = { increment: 1 }
        if (ctxLog.modality === 'listening') modalityUpdates.listeningExposures = { increment: 1 }
        await prisma.grammarItem.update({
          where: { id: ctxLog.itemId },
          data: {
            contextTypes: updatedContextTypes, contextCount: updatedContextTypes.length,
            ...modalityUpdates,
            ...(isNovel ? { novelContextCount: { increment: 1 } } : {}),
            ...(ctxLog.wasProduction ? { productionWeight: { increment: 1.0 } } : {}),
          },
        })
      }
    }
  }

  // Add new items from conversation
  for (const newItem of analysis.newItemsEncountered) {
    const existing = await prisma.lexicalItem.findFirst({ where: { userId, surfaceForm: newItem.surfaceForm } })
    if (!existing) {
      const initialFsrs = createInitialFsrsState()
      await prisma.lexicalItem.create({
        data: {
          userId, surfaceForm: newItem.surfaceForm, meaning: '',
          masteryState: 'introduced',
          recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
          productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
          source: 'conversation', tags: ['conversation'],
          contextTypes: ['conversation'], contextCount: 1,
        },
      })
    }
  }

  // Pragmatic analysis
  const profileData = await prisma.learnerProfile.findUniqueOrThrow({ where: { userId } })
  const pragmaticPrompt = buildPragmaticAnalysisPrompt({
    transcript,
    targetRegister: plan.pragmaticTargets?.targetRegister ?? 'polite',
    targetLanguage: profileData.targetLanguage,
    nativeLanguage: profileData.nativeLanguage,
  })

  const pragmaticResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: pragmaticPrompt }],
  })

  const pragmaticText = pragmaticResponse.content.find((c) => c.type === 'text')
  if (pragmaticText?.type === 'text') {
    const pragResult = parsePragmaticAnalysis(pragmaticText.text)
    const currentPrag = await prisma.pragmaticProfile.findUnique({ where: { userId } })
    const currentState: PragmaticState = currentPrag ? {
      casualAccuracy: currentPrag.casualAccuracy, politeAccuracy: currentPrag.politeAccuracy,
      registerSlipCount: currentPrag.registerSlipCount, preferredRegister: currentPrag.preferredRegister,
      circumlocutionCount: currentPrag.circumlocutionCount, silenceEvents: currentPrag.silenceEvents,
      l1FallbackCount: currentPrag.l1FallbackCount, averageSpeakingPace: currentPrag.averageSpeakingPace,
      hesitationRate: currentPrag.hesitationRate, avoidedGrammarPatterns: currentPrag.avoidedGrammarPatterns,
      avoidedVocabIds: currentPrag.avoidedVocabIds,
    } : {
      casualAccuracy: 0, politeAccuracy: 0, registerSlipCount: 0, preferredRegister: 'polite',
      circumlocutionCount: 0, silenceEvents: 0, l1FallbackCount: 0,
      averageSpeakingPace: null, hesitationRate: null, avoidedGrammarPatterns: [], avoidedVocabIds: [],
    }
    const updatedState = updatePragmaticState(currentState, pragResult)
    await prisma.pragmaticProfile.upsert({ where: { userId }, create: { userId, ...updatedState }, update: updatedState })
  }

  // Recalculate profile
  const lexicalItems = await prisma.lexicalItem.findMany({ where: { userId, masteryState: { not: 'unseen' } } })
  const grammarItems = await prisma.grammarItem.findMany({ where: { userId, masteryState: { not: 'unseen' } } })
  const items = [
    ...lexicalItems.map((item) => ({ id: item.id, itemType: 'lexical' as const, cefrLevel: item.cefrLevel, masteryState: item.masteryState, recognitionFsrs: item.recognitionFsrs as unknown as FsrsState, productionFsrs: item.productionFsrs as unknown as FsrsState, writingProductions: item.writingProductions, readingExposures: item.readingExposures, listeningExposures: item.listeningExposures, speakingProductions: item.speakingProductions })),
    ...grammarItems.map((item) => ({ id: item.id, itemType: 'grammar' as const, cefrLevel: item.cefrLevel, masteryState: item.masteryState, recognitionFsrs: item.recognitionFsrs as unknown as FsrsState, productionFsrs: item.productionFsrs as unknown as FsrsState, writingProductions: item.writingProductions, readingExposures: item.readingExposures, listeningExposures: item.listeningExposures, speakingProductions: item.speakingProductions })),
  ]
  const totalReviewEvents = await prisma.reviewEvent.count({ where: { userId } })
  const update = recalculateProfile({ items, totalReviewEvents, lastActiveDate: new Date().toISOString(), previousStreak: profileData.currentStreak, previousLongestStreak: profileData.longestStreak, previousLastActiveDate: profileData.lastActiveDate?.toISOString() ?? null })
  await prisma.learnerProfile.update({ where: { userId }, data: { ...update, totalReviewEvents, lastActiveDate: new Date() } })

  return NextResponse.json({
    targetsHit: analysis.targetsHit,
    errorsLogged: analysis.errorsLogged,
    avoidanceEvents: analysis.avoidanceEvents,
    newItemsEncountered: analysis.newItemsEncountered,
    overallAssessment: analysis.overallAssessment,
  })
})
