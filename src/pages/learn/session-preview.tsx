import { useState } from 'react'
import { Box, Heading, Text, Card, Flex, Button, Badge } from '@radix-ui/themes'
import { X, RefreshCw, ArrowRight } from 'lucide-react'
import type { KnowledgeBubble, CurriculumRecommendation } from '@shared/types'

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
            <Flex gap="4" align="center">
              <Text size="4" weight="bold">
                {bubble.currentLevel}
              </Text>
              <ArrowRight size={16} style={{ color: 'var(--gray-9)' }} />
              <Text size="4" weight="bold" color="blue">
                {bubble.frontierLevel}
              </Text>
            </Flex>
            <Flex gap="4">
              <Text size="2" color="gray">
                Coverage: {Math.round(bubble.overallCoverage * 100)}%
              </Text>
              {bubble.gapsInCurrentLevel.length > 0 && (
                <Text size="2" color="gray">
                  Gaps: {bubble.gapsInCurrentLevel.length} items
                </Text>
              )}
            </Flex>
          </Flex>
        </Card>
      )}

      <Heading size="4" mb="3">
        Today's Targets
      </Heading>

      {isLoading ? (
        <Text color="gray" size="2">Loading recommendations...</Text>
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
                      <Text size="4" weight="bold">
                        {rec.surfaceForm}
                      </Text>
                      <Button
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={() => handleSkip(rec.id!)}
                        style={{ flexShrink: 0 }}
                      >
                        <X size={14} />
                      </Button>
                    </Flex>
                    {rec.reading && (
                      <Text size="2" color="gray">
                        {rec.reading}
                      </Text>
                    )}
                    <Text size="2">{rec.meaning}</Text>
                    <Flex gap="2">
                      <Badge size="1" variant="soft">
                        Vocab
                      </Badge>
                      {rec.cefrLevel && (
                        <Badge size="1" variant="outline" color="gray">
                          {rec.cefrLevel}
                        </Badge>
                      )}
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
                      <Text size="4" weight="bold">
                        {rec.surfaceForm ?? rec.patternId}
                      </Text>
                      <Button
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={() => handleSkip(rec.id!)}
                        style={{ flexShrink: 0 }}
                      >
                        <X size={14} />
                      </Button>
                    </Flex>
                    {rec.meaning && <Text size="2">{rec.meaning}</Text>}
                    <Flex gap="2">
                      <Badge size="1" variant="soft" color="purple">
                        Grammar
                      </Badge>
                      {rec.cefrLevel && (
                        <Badge size="1" variant="outline" color="gray">
                          {rec.cefrLevel}
                        </Badge>
                      )}
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
