import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type {
  ReviewSubmission,
  ReviewQueueItem,
  ReviewSummary,
  FsrsState,
} from '@shared/types'
import type { Prisma } from '@prisma/client'
import { getDb } from '../db'
import { computeReviewQueue, scheduleReview } from '@core/fsrs/scheduler'
import { computeNextMasteryState } from '@core/mastery/state-machine'
import { MasteryState } from '@shared/types'

const MAX_QUEUE_SIZE = 200

export function registerReviewHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.REVIEW_GET_QUEUE, async (): Promise<ReviewQueueItem[]> => {
    const db = getDb()

    const lexicalItems = await db.lexicalItem.findMany({
      where: { masteryState: { not: MasteryState.Unseen } },
    })

    const grammarItems = await db.grammarItem.findMany({
      where: { masteryState: { not: MasteryState.Unseen } },
    })

    const allItems = [
      ...lexicalItems.map((item) => ({
        id: item.id,
        itemType: 'lexical' as const,
        surfaceForm: item.surfaceForm,
        reading: item.reading,
        meaning: item.meaning,
        masteryState: item.masteryState,
        recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
        productionFsrs: item.productionFsrs as unknown as FsrsState,
      })),
      ...grammarItems.map((item) => ({
        id: item.id,
        itemType: 'grammar' as const,
        surfaceForm: item.name,
        reading: null,
        meaning: item.description ?? item.name,
        masteryState: item.masteryState,
        recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
        productionFsrs: item.productionFsrs as unknown as FsrsState,
      })),
    ]

    const queue = computeReviewQueue(allItems)
    return queue.slice(0, MAX_QUEUE_SIZE)
  })

  ipcMain.handle(
    IPC_CHANNELS.REVIEW_SUBMIT,
    async (_event, submission: ReviewSubmission): Promise<{ newMasteryState: string }> => {
      const db = getDb()

      // Log the review event
      await db.reviewEvent.create({
        data: {
          itemType: submission.itemType,
          grade: submission.grade,
          modality: submission.modality,
          sessionId: submission.sessionId,
          lexicalItemId: submission.itemType === 'lexical' ? submission.itemId : null,
          grammarItemId: submission.itemType === 'grammar' ? submission.itemId : null,
        },
      })

      // Update FSRS state
      const fsrsField =
        submission.modality === 'production' ? 'productionFsrs' : 'recognitionFsrs'

      if (submission.itemType === 'lexical') {
        const item = await db.lexicalItem.findUniqueOrThrow({
          where: { id: submission.itemId },
        })
        const currentFsrs = item[fsrsField] as unknown as FsrsState
        const { nextState } = scheduleReview(currentFsrs, submission.grade)

        const hasProduction = item.productionCount > 0 || submission.modality === 'production'
        const newMastery = computeNextMasteryState({
          currentState: item.masteryState as MasteryState,
          grade: submission.grade,
          modality: submission.modality,
          hasProductionEvidence: hasProduction,
          productionCount: item.productionCount,
        })

        await db.lexicalItem.update({
          where: { id: submission.itemId },
          data: {
            [fsrsField]: nextState as unknown as Prisma.InputJsonValue,
            masteryState: newMastery,
            lastReviewed: new Date(),
            exposureCount: { increment: 1 },
            ...(submission.modality === 'production'
              ? { productionCount: { increment: 1 } }
              : {}),
          },
        })

        return { newMasteryState: newMastery }
      } else {
        const item = await db.grammarItem.findUniqueOrThrow({
          where: { id: submission.itemId },
        })
        const currentFsrs = item[fsrsField] as unknown as FsrsState
        const { nextState } = scheduleReview(currentFsrs, submission.grade)

        const newMastery = computeNextMasteryState({
          currentState: item.masteryState as MasteryState,
          grade: submission.grade,
          modality: submission.modality,
          hasProductionEvidence: submission.modality === 'production',
          productionCount: 0,
        })

        await db.grammarItem.update({
          where: { id: submission.itemId },
          data: {
            [fsrsField]: nextState as unknown as Prisma.InputJsonValue,
            masteryState: newMastery,
            lastReviewed: new Date(),
          },
        })

        return { newMasteryState: newMastery }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.REVIEW_GET_SUMMARY, async (): Promise<ReviewSummary> => {
    const db = getDb()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayReviews = await db.reviewEvent.findMany({
      where: { timestamp: { gte: today } },
    })

    const correctCount = todayReviews.filter(
      (r) => r.grade === 'good' || r.grade === 'easy'
    ).length

    return {
      totalReviewed: todayReviews.length,
      accuracy: todayReviews.length > 0 ? correctCount / todayReviews.length : 0,
      newItemsAdded: 0, // TODO: track in session
      masteryChanges: [], // TODO: track in session
    }
  })
}
