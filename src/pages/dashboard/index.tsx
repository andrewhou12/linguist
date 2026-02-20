import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Box, Heading, Text, Card, Flex, Button } from '@radix-ui/themes'
import type { ReviewSummary, WeeklyStats } from '@shared/types'
import { useFrontier } from '../../hooks/use-frontier'
import { DailyBrief } from './daily-brief'
import { FrontierContainer } from './frontier/frontier-container'

export function DashboardPage() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [dueCount, setDueCount] = useState(0)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const { data: frontierData } = useFrontier()

  useEffect(() => {
    window.linguist.reviewGetSummary().then(setSummary)
    window.linguist.reviewGetQueue().then((q) => setDueCount(q.length))
    window.linguist.dashboardGetWeeklyStats().then(setWeeklyStats)
  }, [])

  return (
    <Box>
      <Heading size="7" mb="4">
        Dashboard
      </Heading>

      <Flex gap="4" wrap="wrap">
        <Card style={{ minWidth: 200, flex: 1 }}>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <span style={{ fontSize: 20 }}>📋</span>
              <Text size="2" color="gray">Due for Review</Text>
            </Flex>
            <Text size="8" weight="bold">
              {dueCount}
            </Text>
            <Text size="1" color="gray">
              {dueCount === 0 ? 'All caught up!' : `${dueCount} card${dueCount === 1 ? '' : 's'} waiting`}
            </Text>
            <Button asChild variant="soft" mt="1">
              <Link to="/review">Start Review</Link>
            </Button>
          </Flex>
        </Card>

        <Card style={{ minWidth: 200, flex: 1 }}>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <span style={{ fontSize: 20 }}>✅</span>
              <Text size="2" color="gray">Reviewed Today</Text>
            </Flex>
            <Text size="8" weight="bold">
              {summary?.totalReviewed ?? 0}
            </Text>
            <Flex align="center" gap="1">
              <span style={{ fontSize: 14 }}>🎯</span>
              <Text size="1" color="gray">
                Accuracy: {summary ? Math.round(summary.accuracy * 100) : 0}%
              </Text>
            </Flex>
          </Flex>
        </Card>

        <Card style={{ minWidth: 300, flex: 1.5 }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <span style={{ fontSize: 20 }}>📊</span>
              <Text size="2" color="gray">This Week</Text>
            </Flex>
            <Flex gap="5" align="center" justify="between">
              <Flex direction="column" align="center" gap="1">
                <span style={{ fontSize: 22 }}>🔥</span>
                <Text size="6" weight="bold">
                  {weeklyStats?.currentStreak ?? 0}
                </Text>
                <Text size="1" color="gray">
                  streak
                </Text>
              </Flex>
              <Flex direction="column" align="center" gap="1">
                <span style={{ fontSize: 22 }}>📝</span>
                <Text size="6" weight="bold">
                  {weeklyStats?.reviewsThisWeek ?? 0}
                </Text>
                <Text size="1" color="gray">
                  reviews
                </Text>
              </Flex>
              <Flex direction="column" align="center" gap="1">
                <span style={{ fontSize: 22 }}>💬</span>
                <Text size="6" weight="bold">
                  {weeklyStats?.sessionsThisWeek ?? 0}
                </Text>
                <Text size="1" color="gray">
                  sessions
                </Text>
              </Flex>
              <Flex direction="column" align="center" gap="1">
                <span style={{ fontSize: 22 }}>🧠</span>
                <Text size="6" weight="bold">
                  {weeklyStats?.itemsLearned ?? 0}
                </Text>
                <Text size="1" color="gray">
                  learned
                </Text>
              </Flex>
            </Flex>
            {weeklyStats && weeklyStats.reviewsThisWeek > 0 && (
              <Flex align="center" gap="1">
                <span style={{ fontSize: 14 }}>🎯</span>
                <Text size="1" color="gray">
                  {Math.round(weeklyStats.accuracyThisWeek * 100)}% accuracy
                </Text>
                <Text size="1" color="gray">·</Text>
                <span style={{ fontSize: 14 }}>🏆</span>
                <Text size="1" color="gray">
                  best streak {weeklyStats.longestStreak}
                </Text>
              </Flex>
            )}
          </Flex>
        </Card>
      </Flex>

      {frontierData && <DailyBrief frontier={frontierData} />}

      <FrontierContainer />
    </Box>
  )
}
