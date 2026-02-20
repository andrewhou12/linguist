import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { ExpandedLearnerProfile, FsrsState } from '@shared/types'
import { getDb } from '../db'
import { recalculateProfile, type ProfileItemInput } from '@core/profile/calculator'

export function registerProfileHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.PROFILE_GET,
    async (): Promise<ExpandedLearnerProfile | null> => {
      const db = getDb()
      const profile = await db.learnerProfile.findUnique({ where: { id: 1 } })
      if (!profile) return null

      return {
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
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPDATE,
    async (
      _event,
      updates: Partial<{
        dailyNewItemLimit: number
        targetRetention: number
        targetLanguage: string
        nativeLanguage: string
      }>
    ): Promise<ExpandedLearnerProfile> => {
      const db = getDb()
      const profile = await db.learnerProfile.update({
        where: { id: 1 },
        data: updates,
      })

      return {
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
    }
  )

  ipcMain.handle(IPC_CHANNELS.PROFILE_RECALCULATE, async (): Promise<ExpandedLearnerProfile> => {
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

    const updated = await db.learnerProfile.update({
      where: { id: 1 },
      data: {
        ...update,
        totalReviewEvents,
        lastActiveDate: new Date(),
      },
    })

    return {
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
    }
  })
}
