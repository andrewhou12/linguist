'use client'

import { Card, Flex, Text, Separator, Badge } from '@radix-ui/themes'
import { Target, X, AlertTriangle, BarChart3 } from 'lucide-react'

interface SessionAnalysisPanelProps {
  targetsPlanned: { vocabulary: number[]; grammar: number[] }
  targetsHit: number[]
  errorsLogged: Array<{ itemId: number; errorType: string; contextQuote: string }>
  avoidanceEvents: Array<{ itemId: number; contextQuote: string }>
  durationSeconds: number | null
}

export function SessionAnalysisPanel({
  targetsPlanned,
  targetsHit,
  errorsLogged,
  avoidanceEvents,
  durationSeconds,
}: SessionAnalysisPanelProps) {
  const plannedCount = (targetsPlanned.vocabulary?.length ?? 0) + (targetsPlanned.grammar?.length ?? 0)
  const hitSet = new Set(targetsHit)
  const minutes = durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : null

  return (
    <Card mt="4">
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <BarChart3 size={16} style={{ color: 'var(--accent-9)' }} />
          <Text size="3" weight="bold">Session Analysis</Text>
        </Flex>

        <Flex gap="4" wrap="wrap">
          {minutes && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Duration</Text>
              <Text size="3" weight="medium">{minutes}m</Text>
            </Flex>
          )}
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">Challenges</Text>
            <Text size="3" weight="medium" color="green">{targetsHit.length}/{plannedCount}</Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">Errors</Text>
            <Text size="3" weight="medium" color={errorsLogged.length > 0 ? 'red' : 'gray'}>{errorsLogged.length}</Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">Avoidance</Text>
            <Text size="3" weight="medium" color={avoidanceEvents.length > 0 ? 'amber' : 'gray'}>{avoidanceEvents.length}</Text>
          </Flex>
        </Flex>

        {/* Targets breakdown */}
        {plannedCount > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium" color="gray">Targets</Text>
              {[...targetsPlanned.vocabulary, ...targetsPlanned.grammar].map((id) => (
                <Flex key={id} align="center" gap="2">
                  {hitSet.has(id) ? (
                    <Badge size="1" color="green" variant="soft">
                      <Target size={10} /> Hit
                    </Badge>
                  ) : (
                    <Badge size="1" color="gray" variant="soft">Missed</Badge>
                  )}
                  <Text size="2">Item #{id}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}

        {/* Errors */}
        {errorsLogged.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium" color="gray">Errors</Text>
              {errorsLogged.map((err, i) => (
                <Flex key={i} align="start" gap="2">
                  <X size={12} style={{ color: 'var(--red-9)', marginTop: 4, flexShrink: 0 }} />
                  <Text size="2">{err.contextQuote || `${err.errorType} on item #${err.itemId}`}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}

        {/* Avoidance */}
        {avoidanceEvents.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium" color="gray">Avoidance Events</Text>
              {avoidanceEvents.map((ev, i) => (
                <Flex key={i} align="start" gap="2">
                  <AlertTriangle size={12} style={{ color: 'var(--amber-9)', marginTop: 4, flexShrink: 0 }} />
                  <Text size="2">{ev.contextQuote || `Item #${ev.itemId}`}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}
      </Flex>
    </Card>
  )
}
