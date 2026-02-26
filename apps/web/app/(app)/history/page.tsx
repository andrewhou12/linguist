'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Box, Heading, Text, Flex, Badge, Table } from '@radix-ui/themes'
import { Clock, Target, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/skeleton'

type SessionListItem = Awaited<ReturnType<typeof api.conversationList>>[number]

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.conversationList().then((data) => {
      setSessions(data)
      setIsLoading(false)
    }).catch((err) => {
      console.error('Failed to load sessions:', err)
      setIsLoading(false)
    })
  }, [])

  return (
    <Box>
      <Heading size="7" mb="4">Session History</Heading>

      {isLoading ? (
        <Flex direction="column" gap="3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Flex key={i} gap="4" align="center">
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={16} />
              <Skeleton width={200} height={16} />
              <Skeleton width={60} height={20} borderRadius={10} />
            </Flex>
          ))}
        </Flex>
      ) : sessions.length === 0 ? (
        <Text color="gray">No sessions yet. Start a conversation to see your history here.</Text>
      ) : (
        <Table.Root variant="surface" size="2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Focus</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Challenges</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Errors</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sessions.map((session) => {
              const date = new Date(session.timestamp)
              const mins = session.durationSeconds ? Math.max(1, Math.round(session.durationSeconds / 60)) : null
              return (
                <Table.Row key={session.id}>
                  <Table.Cell>
                    <Link
                      href={`/history/${session.id}`}
                      style={{ textDecoration: 'none', color: 'var(--accent-11)' }}
                    >
                      <Text size="2" weight="medium">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      <Text size="1" color="gray" style={{ display: 'block' }}>
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex align="center" gap="1">
                      <Clock size={12} style={{ color: 'var(--gray-8)' }} />
                      <Text size="2" color="gray">{mins ? `${mins}m` : '—'}</Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{session.sessionFocus || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex align="center" gap="1">
                      <Target size={12} style={{ color: 'var(--green-9)' }} />
                      <Text size="2">
                        {session.targetsHitCount}/{session.targetsPlannedCount}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    {session.errorsLoggedCount > 0 ? (
                      <Flex align="center" gap="1">
                        <AlertCircle size={12} style={{ color: 'var(--red-9)' }} />
                        <Text size="2" color="red">{session.errorsLoggedCount}</Text>
                      </Flex>
                    ) : (
                      <Text size="2" color="gray">0</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}
