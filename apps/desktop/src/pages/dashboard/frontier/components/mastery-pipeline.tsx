import { Box, Flex, Text, Tooltip } from '@radix-ui/themes'
import { MASTERY_ORDER, MASTERY_LABELS, MASTERY_HEX } from '../../../../constants/mastery'

interface MasteryPipelineProps {
  distribution: Record<string, number>
}

export function MasteryPipeline({ distribution }: MasteryPipelineProps) {
  const total = Object.values(distribution).reduce((sum, n) => sum + n, 0)
  if (total === 0) {
    return (
      <Text size="2" color="gray">
        No items yet
      </Text>
    )
  }

  return (
    <Flex direction="column" gap="2">
      <Flex
        style={{
          height: 28,
          borderRadius: 'var(--radius-2)',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {MASTERY_ORDER.map((state) => {
          const count = distribution[state] ?? 0
          if (count === 0) return null
          const widthPct = (count / total) * 100
          const showLabel = widthPct > 8

          return (
            <Tooltip
              key={state}
              content={`${MASTERY_LABELS[state]}: ${count}`}
            >
              <Box
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: MASTERY_HEX[state],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: count > 0 ? 4 : 0,
                  cursor: 'default',
                  transition: 'width 0.3s ease',
                }}
              >
                {showLabel && (
                  <Text size="1" style={{ color: 'white', fontWeight: 600 }}>
                    {count}
                  </Text>
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Flex>

      {/* Legend row */}
      <Flex gap="3" wrap="wrap">
        {MASTERY_ORDER.map((state) => {
          const count = distribution[state] ?? 0
          if (count === 0) return null
          return (
            <Flex key={state} align="center" gap="1">
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: MASTERY_HEX[state],
                  flexShrink: 0,
                }}
              />
              <Text size="1" color="gray">
                {MASTERY_LABELS[state]}
              </Text>
            </Flex>
          )
        })}
      </Flex>
    </Flex>
  )
}
