import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Box, Heading, Text, Card, Flex, Button } from '@radix-ui/themes'
import type { ReviewSummary } from '@shared/types'

export function DashboardPage() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    window.linguist.reviewGetSummary().then(setSummary)
    window.linguist.reviewGetQueue().then((q) => setDueCount(q.length))
  }, [])

  return (
    <Box>
      <Heading size="7" mb="4">
        Dashboard
      </Heading>

      <Flex gap="4" wrap="wrap">
        <Card style={{ minWidth: 200 }}>
          <Flex direction="column" gap="2">
            <Text size="2" color="gray">
              Due for Review
            </Text>
            <Text size="8" weight="bold">
              {dueCount}
            </Text>
            <Button asChild variant="soft" mt="2">
              <Link to="/review">Start Review</Link>
            </Button>
          </Flex>
        </Card>

        <Card style={{ minWidth: 200 }}>
          <Flex direction="column" gap="2">
            <Text size="2" color="gray">
              Reviewed Today
            </Text>
            <Text size="8" weight="bold">
              {summary?.totalReviewed ?? 0}
            </Text>
            <Text size="2" color="gray">
              Accuracy: {summary ? Math.round(summary.accuracy * 100) : 0}%
            </Text>
          </Flex>
        </Card>

        <Card style={{ minWidth: 200 }}>
          <Flex direction="column" gap="2">
            <Text size="2" color="gray">
              Conversation
            </Text>
            <Button asChild variant="soft" mt="2">
              <Link to="/conversation">New Session</Link>
            </Button>
          </Flex>
        </Card>
      </Flex>
    </Box>
  )
}
