import { Box, Heading, Text } from '@radix-ui/themes'
import { useReview } from '../../hooks/use-review'

export function ReviewPage() {
  const { queue, isLoading } = useReview()

  if (isLoading) {
    return (
      <Box>
        <Heading size="7" mb="4">Review</Heading>
        <Text>Loading review queue...</Text>
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

  return (
    <Box>
      <Heading size="7" mb="4">
        Review ({queue.length} items due)
      </Heading>
      <Text color="gray">Review engine UI will be implemented here.</Text>
    </Box>
  )
}
