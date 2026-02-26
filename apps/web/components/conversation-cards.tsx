'use client'

import { useState } from 'react'
import { Box, Card, Text, Flex, Badge, Button } from '@radix-ui/themes'
import { BookOpen, Languages, AlertCircle, HelpCircle } from 'lucide-react'
import type { MessageSegment } from '@/lib/message-parser'

interface CardProps {
  segment: MessageSegment
}

export function VocabCard({ segment }: CardProps) {
  const d = segment.data ?? {}
  return (
    <Card
      my="2"
      style={{
        borderLeft: '3px solid var(--accent-9)',
        maxWidth: 480,
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <BookOpen size={14} style={{ color: 'var(--accent-9)' }} />
          <Badge size="1" variant="soft">Vocabulary</Badge>
        </Flex>
        <Flex align="baseline" gap="3">
          <Text size="5" weight="bold">{d.surface ?? ''}</Text>
          {d.reading && (
            <Text size="2" color="gray">{d.reading}</Text>
          )}
        </Flex>
        <Text size="2">{d.meaning ?? ''}</Text>
        {d.example && (
          <Box
            mt="1"
            p="2"
            style={{
              backgroundColor: 'var(--gray-2)',
              borderRadius: 'var(--radius-2)',
            }}
          >
            <Text size="2" style={{ display: 'block' }}>{d.example}</Text>
            {d.example_translation && (
              <Text size="1" color="gray" style={{ display: 'block', marginTop: 4 }}>
                {d.example_translation}
              </Text>
            )}
          </Box>
        )}
      </Flex>
    </Card>
  )
}

export function GrammarCard({ segment }: CardProps) {
  const d = segment.data ?? {}
  return (
    <Card
      my="2"
      style={{
        borderLeft: '3px solid var(--purple-9)',
        maxWidth: 480,
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <Languages size={14} style={{ color: 'var(--purple-9)' }} />
          <Badge size="1" variant="soft" color="purple">Grammar</Badge>
        </Flex>
        <Text size="4" weight="bold">{d.pattern ?? ''}</Text>
        <Text size="2">{d.meaning ?? ''}</Text>
        {d.formation && (
          <Text size="1" color="gray">Formation: {d.formation}</Text>
        )}
        {d.example && (
          <Box
            mt="1"
            p="2"
            style={{
              backgroundColor: 'var(--gray-2)',
              borderRadius: 'var(--radius-2)',
            }}
          >
            <Text size="2" style={{ display: 'block' }}>{d.example}</Text>
            {d.example_translation && (
              <Text size="1" color="gray" style={{ display: 'block', marginTop: 4 }}>
                {d.example_translation}
              </Text>
            )}
          </Box>
        )}
      </Flex>
    </Card>
  )
}

export function CorrectionCard({ segment }: CardProps) {
  const d = segment.data ?? {}
  return (
    <Card
      my="2"
      style={{
        borderLeft: '3px solid var(--red-9)',
        maxWidth: 480,
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <AlertCircle size={14} style={{ color: 'var(--red-9)' }} />
          <Badge size="1" variant="soft" color="red">Correction</Badge>
        </Flex>
        <Flex gap="3" align="center">
          <Text size="2" color="red" style={{ textDecoration: 'line-through' }}>
            {d.incorrect ?? ''}
          </Text>
          <Text size="2" color="gray">&rarr;</Text>
          <Text size="2" weight="medium" color="green">
            {d.correct ?? ''}
          </Text>
        </Flex>
        {d.explanation && (
          <Text size="1" color="gray">{d.explanation}</Text>
        )}
      </Flex>
    </Card>
  )
}

export function ReviewPromptCard({ segment }: CardProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const d = segment.data ?? {}
  return (
    <Card
      my="2"
      style={{
        borderLeft: '3px solid var(--blue-9)',
        maxWidth: 480,
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <HelpCircle size={14} style={{ color: 'var(--blue-9)' }} />
          <Badge size="1" variant="soft" color="blue">Review</Badge>
        </Flex>
        <Text size="3" weight="medium">{d.prompt ?? ''}</Text>
        {!showAnswer && (
          <Button size="1" variant="soft" onClick={() => setShowAnswer(true)} style={{ alignSelf: 'flex-start' }}>
            Show Answer
          </Button>
        )}
      </Flex>
    </Card>
  )
}
