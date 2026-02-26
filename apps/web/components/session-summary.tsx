'use client'

import { Card, Flex, Text, Separator, Badge } from '@radix-ui/themes'
import { Check, X, AlertTriangle, Sparkles } from 'lucide-react'
import type { PostSessionAnalysis } from '@linguist/shared/types'

interface SessionSummaryCardProps {
  analysis: PostSessionAnalysis
  durationSeconds: number
  totalTargets: number
}

export function SessionSummaryCard({
  analysis,
  durationSeconds,
  totalTargets,
}: SessionSummaryCardProps) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60))
  const hitCount = analysis.targetsHit?.length ?? 0
  const errorCount = analysis.errorsLogged?.length ?? 0
  const newCount = analysis.newItemsEncountered?.length ?? 0

  return (
    <Card my="3" style={{ maxWidth: 520 }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Sparkles size={16} style={{ color: 'var(--accent-9)' }} />
          <Text size="3" weight="bold">Session Summary</Text>
        </Flex>

        <Flex gap="4" wrap="wrap">
          <Flex direction="column" align="center" gap="1">
            <Text size="5" weight="bold">{minutes}</Text>
            <Text size="1" color="gray">min</Text>
          </Flex>
          <Flex direction="column" align="center" gap="1">
            <Text size="5" weight="bold" color="green">{hitCount}/{totalTargets}</Text>
            <Text size="1" color="gray">challenges</Text>
          </Flex>
          <Flex direction="column" align="center" gap="1">
            <Text size="5" weight="bold" color={errorCount > 0 ? 'red' : 'gray'}>{errorCount}</Text>
            <Text size="1" color="gray">errors</Text>
          </Flex>
          <Flex direction="column" align="center" gap="1">
            <Text size="5" weight="bold" color="blue">{newCount}</Text>
            <Text size="1" color="gray">new items</Text>
          </Flex>
        </Flex>

        {analysis.targetsHit && analysis.targetsHit.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium" color="gray">Targets Hit</Text>
              {analysis.targetsHit.map((id) => (
                <Flex key={id} align="center" gap="2">
                  <Check size={12} style={{ color: 'var(--green-9)' }} />
                  <Text size="2">Item #{id}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}

        {errorCount > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium" color="gray">Errors</Text>
              {analysis.errorsLogged.map((err, i) => (
                <Flex key={i} align="center" gap="2">
                  <X size={12} style={{ color: 'var(--red-9)' }} />
                  <Text size="2">{err.contextQuote || `${err.errorType} on item #${err.itemId}`}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}

        {analysis.avoidanceEvents && analysis.avoidanceEvents.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium" color="gray">Avoidance Detected</Text>
              {analysis.avoidanceEvents.map((ev, i) => (
                <Flex key={i} align="center" gap="2">
                  <AlertTriangle size={12} style={{ color: 'var(--amber-9)' }} />
                  <Text size="2">{ev.contextQuote || `Item #${ev.itemId}`}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}

        {analysis.overallAssessment && (
          <>
            <Separator size="4" />
            <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
              {analysis.overallAssessment}
            </Text>
          </>
        )}
      </Flex>
    </Card>
  )
}
