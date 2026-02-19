import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { TomBrief } from '@shared/types'
import { getDb } from '../db'
import {
  generateDailyBrief,
  type ItemReviewHistory,
  type ErrorRecord,
} from '@core/tom/analyzer'

export function registerTomHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.TOM_RUN_ANALYSIS, async (): Promise<void> => {
    const db = getDb()

    // Gather item review histories
    const lexicalItems = await db.lexicalItem.findMany({
      where: { masteryState: { not: 'unseen' } },
      include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
    })

    const items: ItemReviewHistory[] = lexicalItems.map((item) => ({
      itemId: item.id,
      masteryState: item.masteryState as ItemReviewHistory['masteryState'],
      productionCount: item.productionCount,
      conversationProductionCount: 0, // TODO: compute from conversation sessions
      sessionsInCurrentState: 0, // TODO: compute from session history
      recentGrades: item.reviewEvents.map(
        (e) => e.grade as ItemReviewHistory['recentGrades'][number]
      ),
    }))

    // Gather error records
    const recentErrors = await db.reviewEvent.findMany({
      where: { grade: { in: ['again', 'hard'] } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    })

    const errors: ErrorRecord[] = recentErrors
      .filter((e) => e.sessionId)
      .map((e) => ({
        itemId: e.lexicalItemId ?? e.grammarItemId ?? 0,
        sessionId: e.sessionId!,
        errorType: e.grade,
      }))

    const brief = generateDailyBrief(items, errors, 'N5')

    // Store inferences in DB
    for (const avoidance of brief.avoidancePatterns) {
      await db.tomInference.upsert({
        where: { id: 0 }, // Will create new
        create: {
          type: 'avoidance',
          itemIds: [avoidance.itemId],
          confidence: 0.7,
          description: `Item avoided for ${avoidance.sessionsAvoided} sessions`,
        },
        update: {
          confidence: 0.7,
          description: `Item avoided for ${avoidance.sessionsAvoided} sessions`,
        },
      })
    }

    for (const pair of brief.confusionPairs) {
      await db.tomInference.create({
        data: {
          type: 'confusion_pair',
          itemIds: pair.itemIds,
          confidence: 0.6,
          description: pair.description,
        },
      })
    }

    for (const regression of brief.regressions) {
      await db.tomInference.create({
        data: {
          type: 'regression',
          itemIds: [regression.itemId],
          confidence: 0.8,
          description: `Regression: recent grades ${regression.recentGrades.join(', ')}`,
        },
      })
    }
  })

  ipcMain.handle(IPC_CHANNELS.TOM_GET_BRIEF, async (): Promise<TomBrief> => {
    const db = getDb()

    const lexicalItems = await db.lexicalItem.findMany({
      where: { masteryState: { not: 'unseen' } },
      include: { reviewEvents: { orderBy: { timestamp: 'desc' }, take: 10 } },
    })

    const items: ItemReviewHistory[] = lexicalItems.map((item) => ({
      itemId: item.id,
      masteryState: item.masteryState as ItemReviewHistory['masteryState'],
      productionCount: item.productionCount,
      conversationProductionCount: 0,
      sessionsInCurrentState: 0,
      recentGrades: item.reviewEvents.map(
        (e) => e.grade as ItemReviewHistory['recentGrades'][number]
      ),
    }))

    const recentErrors = await db.reviewEvent.findMany({
      where: { grade: { in: ['again', 'hard'] } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    })

    const errors: ErrorRecord[] = recentErrors
      .filter((e) => e.sessionId)
      .map((e) => ({
        itemId: e.lexicalItemId ?? e.grammarItemId ?? 0,
        sessionId: e.sessionId!,
        errorType: e.grade,
      }))

    return generateDailyBrief(items, errors, 'N5')
  })

  ipcMain.handle(
    IPC_CHANNELS.TOM_GET_INFERENCES,
    async (): Promise<
      Array<{
        id: number
        type: string
        itemIds: number[]
        confidence: number
        description: string
        resolved: boolean
      }>
    > => {
      const db = getDb()
      const inferences = await db.tomInference.findMany({
        where: { resolved: false },
        orderBy: { lastUpdated: 'desc' },
      })

      return inferences.map((i) => ({
        id: i.id,
        type: i.type,
        itemIds: i.itemIds,
        confidence: i.confidence,
        description: i.description,
        resolved: i.resolved,
      }))
    }
  )
}
