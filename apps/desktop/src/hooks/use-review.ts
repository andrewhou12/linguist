import { useEffect, useState, useCallback } from 'react'
import type {
  ReviewQueueItem,
  ReviewSubmission,
  ReviewSummary,
  ItemType,
  MasteryState,
} from '@shared/types'

export interface SessionStats {
  reviewed: number
  correct: number
  masteryChanges: Array<{
    itemId: number
    itemType: ItemType
    surfaceForm: string
    from: string
    to: string
  }>
}

export function useReview() {
  const [queue, setQueue] = useState<ReviewQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    reviewed: 0,
    correct: 0,
    masteryChanges: [],
  })

  const loadQueue = useCallback(async () => {
    setIsLoading(true)
    const items = await window.linguist.reviewGetQueue()
    setQueue(items)
    setCurrentIndex(0)
    setSessionStats({ reviewed: 0, correct: 0, masteryChanges: [] })
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const currentItem = queue[currentIndex] ?? null
  const isComplete = !isLoading && (queue.length === 0 || currentIndex >= queue.length)

  const submitReview = useCallback(
    async (submission: ReviewSubmission) => {
      const currentCard = queue[currentIndex]
      const result = await window.linguist.reviewSubmit(submission)

      setSessionStats((prev) => {
        const isCorrect =
          submission.grade === 'good' || submission.grade === 'easy'
        const newStats: SessionStats = {
          reviewed: prev.reviewed + 1,
          correct: prev.correct + (isCorrect ? 1 : 0),
          masteryChanges: [...prev.masteryChanges],
        }

        if (currentCard && result.newMasteryState !== currentCard.masteryState) {
          newStats.masteryChanges.push({
            itemId: submission.itemId,
            itemType: submission.itemType,
            surfaceForm: currentCard.surfaceForm,
            from: currentCard.masteryState,
            to: result.newMasteryState,
          })
        }

        return newStats
      })

      setCurrentIndex((prev) => prev + 1)
      return result
    },
    [queue, currentIndex]
  )

  const getSummary = useCallback(async (): Promise<ReviewSummary> => {
    return window.linguist.reviewGetSummary()
  }, [])

  return {
    queue,
    isLoading,
    currentItem,
    currentIndex,
    isComplete,
    sessionStats,
    submitReview,
    getSummary,
    reload: loadQueue,
  }
}
