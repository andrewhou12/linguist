import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Box, Heading, Text, Card, Flex, Button } from '@radix-ui/themes'
import type { ReviewSummary, WeeklyStats } from '@shared/types'
import { useFrontier } from '../../hooks/use-frontier'
import { DailyBrief } from './daily-brief'
import { FrontierContainer } from './frontier/frontier-container'
import { Skeleton } from '../../components/skeleton'

export function DashboardPage() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const { data: frontierData } = useFrontier()

  useEffect(() => {
    window.linguist.reviewGetSummary().then(setSummary)
    window.linguist.reviewGetQueue().then((q) => setDueCount(q.length))
    window.linguist.dashboardGetWeeklyStats().then(setWeeklyStats)
  }, [])

  const isLoading = summary === null || dueCount === null || weeklyStats === null

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
            {isLoading ? (
              <>
                <Skeleton width={60} height={36} />
                <Skeleton width={120} height={12} />
                <Skeleton width="100%" height={32} borderRadius={6} />
              </>
            ) : (
              <>
                <Text size="8" weight="bold">
                  {dueCount}
                </Text>
                <Text size="1" color="gray">
                  {dueCount === 0 ? 'All caught up!' : `${dueCount} card${dueCount === 1 ? '' : 's'} waiting`}
                </Text>
                <Button asChild variant="soft" mt="1">
                  <Link to="/review">Start Review</Link>
                </Button>
              </>
            )}
          </Flex>
        </Card>

        <Card style={{ minWidth: 200, flex: 1 }}>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <span style={{ fontSize: 20 }}>✅</span>
              <Text size="2" color="gray">Reviewed Today</Text>
            </Flex>
            {isLoading ? (
              <>
                <Skeleton width={60} height={36} />
                <Skeleton width={100} height={12} />
              </>
            ) : (
              <>
                <Text size="8" weight="bold">
                  {summary?.totalReviewed ?? 0}
                </Text>
                <Flex align="center" gap="1">
                  <span style={{ fontSize: 14 }}>🎯</span>
                  <Text size="1" color="gray">
                    Accuracy: {summary ? Math.round(summary.accuracy * 100) : 0}%
                  </Text>
                </Flex>
              </>
            )}
          </Flex>
        </Card>

        <Card style={{ minWidth: 360, flex: 2 }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <span style={{ fontSize: 20 }}>📊</span>
              <Text size="2" color="gray">This Week</Text>
            </Flex>
            {isLoading ? (
              <Flex align="stretch" style={{ gap: 0 }}>
                {['Streak', 'Reviews', 'Sessions', 'Learned'].map((label, i, arr) => (
                  <Flex
                    key={label}
                    direction="column"
                    gap="2"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRight: i < arr.length - 1 ? '1px solid var(--gray-a4)' : 'none',
                    }}
                  >
                    <Skeleton width={50} height={24} />
                    <Skeleton width={60} height={10} />
                  </Flex>
                ))}
              </Flex>
            ) : (
              <>
                <Flex align="stretch" style={{ gap: 0 }}>
                  {[
                    { emoji: '🔥', value: weeklyStats?.currentStreak ?? 0, label: 'Streak' },
                    { emoji: '📝', value: weeklyStats?.reviewsThisWeek ?? 0, label: 'Reviews' },
                    { emoji: '💬', value: weeklyStats?.sessionsThisWeek ?? 0, label: 'Sessions' },
                    { emoji: '🧠', value: weeklyStats?.itemsLearned ?? 0, label: 'Learned' },
                  ].map((stat, i, arr) => (
                    <Flex
                      key={stat.label}
                      direction="column"
                      gap="1"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRight: i < arr.length - 1 ? '1px solid var(--gray-a4)' : 'none',
                      }}
                    >
                      <Flex align="center" gap="2">
                        <span style={{ fontSize: 18 }}>{stat.emoji}</span>
                        <Text size="5" weight="bold">{stat.value}</Text>
                      </Flex>
                      <Text size="1" color="gray">{stat.label}</Text>
                    </Flex>
                  ))}
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
                      Best Streak {weeklyStats.longestStreak}
                    </Text>
                  </Flex>
                )}
              </>
            )}
          </Flex>
        </Card>
      </Flex>

      {frontierData && <DailyBrief frontier={frontierData} />}

      <FrontierContainer />
    </Box>
  )
}
