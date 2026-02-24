import { Box, Heading, Text, Flex, Progress } from '@radix-ui/themes'
import { useReview } from '../../hooks/use-review'
import { ReviewCard } from './review-card'
import { SessionSummary } from './session-summary'
import { Spinner } from '../../components/spinner'
import type { ReviewGrade } from '@shared/types'

export function ReviewPage() {
  const {
    queue,
    isLoading,
    currentItem,
    currentIndex,
    isComplete,
    sessionStats,
    submitReview,
  } = useReview()

  if (isLoading) {
    return (
      <Box>
        <Heading size="7" mb="4">Review</Heading>
        <Flex align="center" gap="3" mt="6">
          <Spinner size={18} />
          <Text size="2" color="gray">Loading review queue...</Text>
        </Flex>
      </Box>
    )
  }

  if (queue.length === 0) {
    return (
      <Box>
        <Heading size="7" mb="4">Review</Heading>
        <Text>No items due for review. Check back later!</Text>
      </Box>
    )
  }

  if (isComplete) {
    return <SessionSummary stats={sessionStats} />
  }

  const progress = Math.round(((currentIndex) / queue.length) * 100)

  const handleGrade = (grade: ReviewGrade) => {
    if (!currentItem) return
    submitReview({
      itemId: currentItem.id,
      itemType: currentItem.itemType,
      grade,
      modality: currentItem.modality,
    })
  }

  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Heading size="5">Review</Heading>
        <Text size="2" color="gray">
          {currentIndex + 1} / {queue.length}
        </Text>
      </Flex>

      <Progress value={progress} size="1" mb="6" />

      {currentItem && (
        <ReviewCard item={currentItem} onGrade={handleGrade} />
      )}
    </Box>
  )
}
