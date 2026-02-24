import { Box, Flex, Text } from '@radix-ui/themes'
import type { LevelBreakdown } from '@shared/types'

interface LevelProgressBarProps {
  level: LevelBreakdown
  isCurrent: boolean
  isFrontier: boolean
  isAboveFrontier: boolean
}

export function LevelProgressBar({
  level,
  isCurrent,
  isFrontier,
  isAboveFrontier,
}: LevelProgressBarProps) {
  const coveragePct = Math.round(level.coverage * 100)
  const productionPct =
    level.totalReferenceItems > 0
      ? Math.round((level.productionReady / level.totalReferenceItems) * 100)
      : 0

  return (
    <Flex
      align="center"
      gap="3"
      py="2"
      px="3"
      style={{
        borderRadius: 'var(--radius-2)',
        opacity: isAboveFrontier ? 0.4 : 1,
        border: isCurrent
          ? '1px solid var(--accent-9)'
          : isFrontier
            ? '1px dashed var(--accent-7)'
            : '1px solid transparent',
        backgroundColor: isCurrent ? 'var(--accent-2)' : undefined,
      }}
    >
      <Text
        size="2"
        weight="bold"
        style={{ width: 32, flexShrink: 0 }}
      >
        {level.level}
      </Text>

      <Box style={{ flex: 1, position: 'relative', height: 20, borderRadius: 'var(--radius-1)' }}>
        {/* Background track */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'var(--gray-3)',
            borderRadius: 'var(--radius-1)',
          }}
        />
        {/* Recognition coverage */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${coveragePct}%`,
            backgroundColor: 'var(--accent-5)',
            borderRadius: 'var(--radius-1)',
            transition: 'width 0.3s ease',
          }}
        />
        {/* Production coverage (darker, overlaid) */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${productionPct}%`,
            backgroundColor: 'var(--accent-9)',
            borderRadius: 'var(--radius-1)',
            transition: 'width 0.3s ease',
          }}
        />
      </Box>

      <Text size="1" color="gray" style={{ width: 48, textAlign: 'right', flexShrink: 0 }}>
        {coveragePct}%
      </Text>

      <Text size="1" color="gray" style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
        {level.knownItems}/{level.totalReferenceItems}
      </Text>
    </Flex>
  )
}
