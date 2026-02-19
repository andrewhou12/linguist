import { useEffect, useState, useCallback } from 'react'
import type {
  ReviewQueueItem,
  ReviewSubmission,
  ReviewSummary,
} from '@shared/types'

export function useReview() {
  const [queue, setQueue] = useState<ReviewQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadQueue = useCallback(async () => {
    setIsLoading(true)
    const items = await window.linguist.reviewGetQueue()
    setQueue(items)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const submitReview = useCallback(
    async (submission: ReviewSubmission) => {
      const result = await window.linguist.reviewSubmit(submission)
      // Remove the reviewed item from the local queue
      setQueue((prev) =>
        prev.filter(
          (item) =>
            !(
              item.id === submission.itemId &&
              item.itemType === submission.itemType &&
              item.modality === submission.modality
            )
        )
      )
      return result
    },
    []
  )

  const getSummary = useCallback(async (): Promise<ReviewSummary> => {
    return window.linguist.reviewGetSummary()
  }, [])

  return { queue, isLoading, submitReview, getSummary, reload: loadQueue }
}
