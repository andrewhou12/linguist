'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Table } from '@radix-ui/themes'
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
    <div>
      <h1 className="text-3xl font-bold mb-4">Session History</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={16} />
              <Skeleton width={200} height={16} />
              <Skeleton width={60} height={20} borderRadius={10} />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500">No sessions yet. Start a conversation to see your history here.</p>
      ) : (
        /* Keep Radix Table for now - complex interactive component */
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
                      className="no-underline text-blue-700"
                    >
                      <span className="text-sm font-medium block">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-500 block">
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-500">{mins ? `${mins}m` : '—'}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm">{session.sessionFocus || '—'}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-1">
                      <Target size={12} className="text-green-600" />
                      <span className="text-sm">
                        {session.targetsHitCount}/{session.targetsPlannedCount}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {session.errorsLoggedCount > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={12} className="text-red-600" />
                        <span className="text-sm text-red-600">{session.errorsLoggedCount}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">0</span>
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      )}
    </div>
  )
}
