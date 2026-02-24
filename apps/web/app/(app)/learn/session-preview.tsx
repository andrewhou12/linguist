'use client'

import { useState } from 'react'
import { Box, Heading, Text, Card, Flex, Button, Badge } from '@radix-ui/themes'
import { X, RefreshCw, ArrowRight } from 'lucide-react'
import type { KnowledgeBubble, CurriculumRecommendation } from '@linguist/shared/types'
import { Spinner } from '@/components/spinner'

interface SessionPreviewProps {
  bubble: KnowledgeBubble | null
  recommendations: CurriculumRecommendation[]
  isLoading: boolean
  onSkip: (id: number) => void
  onRefresh: () => void
  onStart: () => void
}

export function SessionPreview({
  bubble,
  recommendations,
  isLoading,
  onSkip,
  onRefresh,
  onStart,
}: SessionPreviewProps) {
  const [skippedIds, setSkippedIds] = useState<Set<number>>(new Set())

  const handleSkip = (id: number) => {
    setSkippedIds((prev) => new Set(prev).add(id))
    onSkip(id)
  }

  const visibleRecs = recommendations.filter((r) => r.id != null && !skippedIds.has(r.id))
  const vocabRecs = visibleRecs.filter((r) => r.itemType === 'lexical')
  const grammarRecs = visibleRecs.filter((r) => r.itemType === 'grammar')

  return (
    <Box style={{ maxWidth: 640, margin: '0 auto' }}>
      <Heading size="7" mb="5">
        Learn
      </Heading>

      {bubble && (
        <Card mb="5">
          <Flex direction="column" gap="2">
            <Text size="2" weight="medium" color="gray">
              Knowledge Frontier
            </Text>
            <Flex direction="column" gap="1">
              {bubble.levelBreakdowns
                .filter((lb) => lb.totalReferenceItems > 0)
                .map((lb) => (
                  <Flex key={lb.level} align="center" gap="3" py="1" px="2">
                    <Text size="2" weight="bold" style={{ width: 32 }}>{lb.level}</Text>
                    <Box style={{ flex: 1, height: 16, borderRadius: 4, backgroundColor: 'var(--gray-3)', position: 'relative', overflow: 'hidden' }}>
                      <Box style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${Math.round(lb.coverage * 100)}%`, backgroundColor: 'var(--accent-5)', borderRadius: 4 }} />
                      <Box style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${lb.totalReferenceItems > 0 ? Math.round((lb.productionReady / lb.totalReferenceItems) * 100) : 0}%`, backgroundColor: 'var(--accent-9)', borderRadius: 4 }} />
                    </Box>
                    <Text size="1" color="gray" style={{ width: 40, textAlign: 'right' }}>{Math.round(lb.coverage * 100)}%</Text>
                  </Flex>
                ))}
            </Flex>
            <Flex gap="3" align="center">
              <Flex gap="2" align="center">
                <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--accent-9)' }} />
                <Text size="1" color="gray">production</Text>
              </Flex>
              <Flex gap="2" align="center">
                <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--accent-5)' }} />
                <Text size="1" color="gray">recognition</Text>
              </Flex>
            </Flex>
            {bubble.gapsInCurrentLevel.length > 0 && (
              <Text size="2" color="gray">
                Gaps: {bubble.gapsInCurrentLevel.length} items in {bubble.currentLevel} remaining
              </Text>
            )}
          </Flex>
        </Card>
      )}

      <Heading size="4" mb="3">
        Today&apos;s Targets
      </Heading>

      {isLoading ? (
        <Flex align="center" gap="3" mb="5">
          <Spinner size={16} />
          <Text color="gray" size="2">Loading recommendations...</Text>
        </Flex>
      ) : visibleRecs.length === 0 ? (
        <Text color="gray" size="2">No recommendations available. Try refreshing.</Text>
      ) : (
        <Flex direction="column" gap="3" mb="5">
          {vocabRecs.length > 0 && (
            <Flex gap="3" wrap="wrap">
              {vocabRecs.map((rec) => (
                <Card key={rec.id} style={{ minWidth: 180, flex: '1 1 180px', maxWidth: 280 }}>
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="start">
                      <Text size="4" weight="bold">{rec.surfaceForm}</Text>
                      <Button size="1" variant="ghost" color="gray" onClick={() => handleSkip(rec.id!)} style={{ flexShrink: 0 }}>
                        <X size={14} />
                      </Button>
                    </Flex>
                    {rec.reading && <Text size="2" color="gray">{rec.reading}</Text>}
                    <Text size="2">{rec.meaning}</Text>
                    <Flex gap="2">
                      <Badge size="1" variant="soft">Vocab</Badge>
                      {rec.cefrLevel && <Badge size="1" variant="outline" color="gray">{rec.cefrLevel}</Badge>}
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}

          {grammarRecs.length > 0 && (
            <Flex gap="3" wrap="wrap">
              {grammarRecs.map((rec) => (
                <Card key={rec.id} style={{ minWidth: 180, flex: '1 1 180px', maxWidth: 280 }}>
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="start">
                      <Text size="4" weight="bold">{rec.surfaceForm ?? rec.patternId}</Text>
                      <Button size="1" variant="ghost" color="gray" onClick={() => handleSkip(rec.id!)} style={{ flexShrink: 0 }}>
                        <X size={14} />
                      </Button>
                    </Flex>
                    {rec.meaning && <Text size="2">{rec.meaning}</Text>}
                    <Flex gap="2">
                      <Badge size="1" variant="soft" color="purple">Grammar</Badge>
                      {rec.cefrLevel && <Badge size="1" variant="outline" color="gray">{rec.cefrLevel}</Badge>}
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}
        </Flex>
      )}

      <Flex gap="3" justify="end">
        <Button variant="soft" color="gray" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
        <Button onClick={onStart} disabled={isLoading || visibleRecs.length === 0}>
          Start Session
          <ArrowRight size={14} />
        </Button>
      </Flex>
    </Box>
  )
}
