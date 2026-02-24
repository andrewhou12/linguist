import { Flex, Text, Box } from '@radix-ui/themes'

interface CeilingComparisonProps {
  comprehensionCeiling: string
  productionCeiling: string
}

const LEVEL_VALUES: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
}

export function CeilingComparison({
  comprehensionCeiling,
  productionCeiling,
}: CeilingComparisonProps) {
  const compValue = LEVEL_VALUES[comprehensionCeiling] ?? 0
  const prodValue = LEVEL_VALUES[productionCeiling] ?? 0
  const maxValue = 6

  return (
    <Flex gap="5" align="end">
      <CeilingBar label="Comprehension" level={comprehensionCeiling} value={compValue} max={maxValue} />
      <CeilingBar label="Production" level={productionCeiling} value={prodValue} max={maxValue} />
    </Flex>
  )
}

function CeilingBar({
  label,
  level,
  value,
  max,
}: {
  label: string
  level: string
  value: number
  max: number
}) {
  const heightPct = max > 0 ? (value / max) * 100 : 0

  return (
    <Flex direction="column" align="center" gap="1" style={{ flex: 1 }}>
      <Text size="1" weight="bold">
        {level}
      </Text>
      <Box
        style={{
          width: '100%',
          maxWidth: 60,
          height: 80,
          borderRadius: 'var(--radius-2)',
          backgroundColor: 'var(--gray-3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${heightPct}%`,
            backgroundColor: label === 'Comprehension' ? 'var(--accent-9)' : 'var(--purple-9)',
            borderRadius: 'var(--radius-2)',
            transition: 'height 0.3s ease',
          }}
        />
      </Box>
      <Text size="1" color="gray">
        {label}
      </Text>
    </Flex>
  )
}
