import { useState, useEffect, useCallback } from 'react'
import { Box, Card, Flex, Text, Button, Badge, Kbd, TextField } from '@radix-ui/themes'
import type { ReviewQueueItem, ReviewGrade } from '@shared/types'
import { MASTERY_COLORS, formatMasteryLabel } from '../../constants/mastery'

interface ReviewCardProps {
  item: ReviewQueueItem
  onGrade: (grade: ReviewGrade) => void
}

const GRADE_CONFIG: Array<{
  grade: ReviewGrade
  label: string
  color: 'red' | 'orange' | 'green' | 'blue'
  key: string
}> = [
  { grade: 'again', label: 'Again', color: 'red', key: '1' },
  { grade: 'hard', label: 'Hard', color: 'orange', key: '2' },
  { grade: 'good', label: 'Good', color: 'green', key: '3' },
  { grade: 'easy', label: 'Easy', color: 'blue', key: '4' },
]

export function ReviewCard({ item, onGrade }: ReviewCardProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [typedAnswer, setTypedAnswer] = useState('')

  const isProduction = item.modality === 'production'

  // Reset state when item changes
  useEffect(() => {
    setSide('front')
    setTypedAnswer('')
  }, [item.id, item.modality])

  const showAnswer = useCallback(() => {
    setSide('back')
  }, [])

  const handleGrade = useCallback(
    (grade: ReviewGrade) => {
      onGrade(grade)
    },
    [onGrade]
  )

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture keyboard shortcuts when typing in the input
      if (isProduction && side === 'front' && e.key !== 'Enter') return

      if (side === 'front' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        showAnswer()
        return
      }

      if (side === 'back') {
        const gradeMap: Record<string, ReviewGrade> = {
          '1': 'again',
          '2': 'hard',
          '3': 'good',
          '4': 'easy',
        }
        const grade = gradeMap[e.key]
        if (grade) {
          e.preventDefault()
          handleGrade(grade)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [side, isProduction, showAnswer, handleGrade])

  return (
    <Card
      style={{
        maxWidth: 500,
        margin: '0 auto',
        padding: 32,
        minHeight: 300,
      }}
    >
      {side === 'front' ? (
        <Flex direction="column" align="center" justify="center" gap="4" style={{ minHeight: 220 }}>
          {isProduction ? (
            <>
              <Text size="2" color="gray">
                Produce the word for:
              </Text>
              <Text size="7" weight="bold" align="center">
                {item.meaning}
              </Text>
              {item.reading && (
                <Text size="3" color="gray">
                  Reading: {item.reading}
                </Text>
              )}
              <Box style={{ width: '100%', maxWidth: 300, marginTop: 8 }}>
                <TextField.Root
                  size="3"
                  placeholder="Type your answer..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      showAnswer()
                    }
                  }}
                  autoFocus
                />
              </Box>
              <Button size="3" variant="soft" onClick={showAnswer} mt="2">
                Submit <Kbd>Enter</Kbd>
              </Button>
            </>
          ) : (
            <>
              <Text size="2" color="gray">
                What does this mean?
              </Text>
              <Text size="9" weight="bold" align="center" style={{ lineHeight: 1.3 }}>
                {item.surfaceForm}
              </Text>
              {item.reading && (
                <Text size="4" color="gray">
                  {item.reading}
                </Text>
              )}
              <Button size="3" variant="soft" onClick={showAnswer} mt="4">
                Show Answer <Kbd>Space</Kbd>
              </Button>
            </>
          )}
        </Flex>
      ) : (
        <Flex direction="column" align="center" gap="4" style={{ minHeight: 220 }}>
          <Flex direction="column" align="center" gap="2">
            <Text size="7" weight="bold">
              {item.surfaceForm}
            </Text>
            {item.reading && (
              <Text size="4" color="gray">
                {item.reading}
              </Text>
            )}
          </Flex>

          <Text size="5" align="center">
            {item.meaning}
          </Text>

          <Badge color={MASTERY_COLORS[item.masteryState] ?? 'gray'}>
            {formatMasteryLabel(item.masteryState)}
          </Badge>

          {isProduction && typedAnswer && (
            <Box
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-2)',
                backgroundColor:
                  typedAnswer.trim() === item.surfaceForm
                    ? 'var(--green-3)'
                    : 'var(--red-3)',
                width: '100%',
                maxWidth: 300,
                textAlign: 'center',
              }}
            >
              <Text size="3">
                Your answer: <strong>{typedAnswer}</strong>
              </Text>
            </Box>
          )}

          <Flex gap="2" mt="4" wrap="wrap" justify="center">
            {GRADE_CONFIG.map(({ grade, label, color, key }) => (
              <Button
                key={grade}
                size="3"
                variant="soft"
                color={color}
                onClick={() => handleGrade(grade)}
                style={{ minWidth: 90 }}
              >
                {label} <Kbd>{key}</Kbd>
              </Button>
            ))}
          </Flex>
        </Flex>
      )}
    </Card>
  )
}
