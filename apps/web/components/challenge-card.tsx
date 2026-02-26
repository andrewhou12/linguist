'use client'

import { Card, Flex, Text } from '@radix-ui/themes'
import { Check, Circle } from 'lucide-react'
import type { ExpandedSessionPlan } from '@linguist/shared/types'

interface ChallengeCardProps {
  plan: ExpandedSessionPlan
  targetsHit: Set<string>
}

export function ChallengeCard({ plan, targetsHit }: ChallengeCardProps) {
  const vocabTargets = plan.targetVocabulary ?? []
  const grammarTargets = plan.targetGrammar ?? []
  const curriculumItems = plan.curriculumNewItems ?? []

  const allTargets: Array<{ id: string; label: string }> = [
    ...vocabTargets.map((id) => ({ id: String(id), label: `Vocab #${id}` })),
    ...grammarTargets.map((id) => ({ id: String(id), label: `Grammar #${id}` })),
    ...curriculumItems.map((c) => ({
      id: c.surfaceForm ?? c.patternId ?? 'unknown',
      label: c.surfaceForm ?? c.patternId ?? 'New item',
    })),
  ]

  if (allTargets.length === 0) return null

  const hitCount = allTargets.filter((t) => targetsHit.has(t.id)).length

  return (
    <Card
      style={{
        backgroundColor: 'var(--gray-2)',
        borderBottom: '1px solid var(--gray-4)',
      }}
    >
      <Flex align="center" gap="3" wrap="wrap">
        <Text size="1" weight="medium" color="gray" style={{ flexShrink: 0 }}>
          Challenges ({hitCount}/{allTargets.length})
        </Text>
        {allTargets.map((target) => {
          const isHit = targetsHit.has(target.id)
          return (
            <Flex key={target.id} align="center" gap="1">
              {isHit ? (
                <Check size={12} style={{ color: 'var(--green-9)' }} />
              ) : (
                <Circle size={12} style={{ color: 'var(--gray-7)' }} />
              )}
              <Text
                size="1"
                color={isHit ? 'green' : 'gray'}
                style={{ textDecoration: isHit ? 'line-through' : 'none' }}
              >
                {target.label}
              </Text>
            </Flex>
          )
        })}
      </Flex>
    </Card>
  )
}
