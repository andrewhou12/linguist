import { useNavigate } from 'react-router'
import { Box, Card, Flex, Heading, Text, Button, Badge } from '@radix-ui/themes'
import type { SessionStats } from '../../hooks/use-review'

interface SessionSummaryProps {
  stats: SessionStats
}

const MASTERY_COLORS: Record<string, 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'> = {
  unseen: 'gray',
  introduced: 'gray',
  apprentice_1: 'red',
  apprentice_2: 'red',
  apprentice_3: 'orange',
  apprentice_4: 'orange',
  journeyman: 'yellow',
  expert: 'green',
  master: 'blue',
  burned: 'purple',
}

function formatMasteryLabel(state: string): string {
  return state
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function SessionSummary({ stats }: SessionSummaryProps) {
  const navigate = useNavigate()
  const accuracy =
    stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0

  return (
    <Box style={{ maxWidth: 500, margin: '0 auto' }}>
      <Heading size="7" mb="6" align="center">
        Session Complete
      </Heading>

      <Flex gap="4" mb="6" justify="center">
        <Card style={{ minWidth: 120, textAlign: 'center' }}>
          <Flex direction="column" gap="1" align="center" p="2">
            <Text size="2" color="gray">
              Reviewed
            </Text>
            <Text size="8" weight="bold">
              {stats.reviewed}
            </Text>
          </Flex>
        </Card>

        <Card style={{ minWidth: 120, textAlign: 'center' }}>
          <Flex direction="column" gap="1" align="center" p="2">
            <Text size="2" color="gray">
              Accuracy
            </Text>
            <Text
              size="8"
              weight="bold"
              color={accuracy >= 80 ? 'green' : accuracy >= 60 ? 'orange' : 'red'}
            >
              {accuracy}%
            </Text>
          </Flex>
        </Card>
      </Flex>

      {/* Accuracy bar */}
      <Box mb="6">
        <Box
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'var(--gray-4)',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              height: '100%',
              width: `${accuracy}%`,
              borderRadius: 4,
              backgroundColor:
                accuracy >= 80
                  ? 'var(--green-9)'
                  : accuracy >= 60
                    ? 'var(--orange-9)'
                    : 'var(--red-9)',
              transition: 'width 0.5s ease',
            }}
          />
        </Box>
      </Box>

      {stats.masteryChanges.length > 0 && (
        <Card mb="6">
          <Flex direction="column" gap="3" p="2">
            <Text size="3" weight="bold">
              Mastery Changes
            </Text>
            {stats.masteryChanges.map((change, i) => (
              <Flex key={i} align="center" gap="2" wrap="wrap">
                <Text size="2" style={{ minWidth: 80 }}>
                  {change.surfaceForm}
                </Text>
                <Badge color={MASTERY_COLORS[change.from] ?? 'gray'} size="1">
                  {formatMasteryLabel(change.from)}
                </Badge>
                <Text size="2" color="gray">
                  →
                </Text>
                <Badge color={MASTERY_COLORS[change.to] ?? 'gray'} size="1">
                  {formatMasteryLabel(change.to)}
                </Badge>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      <Flex justify="center">
        <Button size="3" onClick={() => navigate('/dashboard')}>
          Done
        </Button>
      </Flex>
    </Box>
  )
}
