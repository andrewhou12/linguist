'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type {
  ReviewQueueItem,
  ReviewSubmission,
  ReviewSummary,
  ItemType,
} from '@lingle/shared/types'
import { api } from '@/lib/api'

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
  const cachedQueue = api.peekCache<ReviewQueueItem[]>('/review/queue')
  const [queue, setQueue] = useState<ReviewQueueItem[]>(cachedQueue ?? [])
  const [isLoading, setIsLoading] = useState(!cachedQueue)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    reviewed: 0,
    correct: 0,
    masteryChanges: [],
  })
  const skipLoadingRef = useRef(!!cachedQueue)

  const loadQueue = useCallback(async () => {
    if (!skipLoadingRef.current) setIsLoading(true)
    skipLoadingRef.current = false
    const items = await api.reviewGetQueue()
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
      const result = await api.reviewSubmit(submission)

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
    return api.reviewGetSummary()
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
