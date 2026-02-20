import { Box, Flex, Text, Tooltip } from '@radix-ui/themes'
import type { FrontierItem } from '@shared/types'
import { MASTERY_ORDER, MASTERY_LABELS } from '../../../../constants/mastery'

interface DotMapGridProps {
  items: FrontierItem[]
}

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1']
const DOT_CAP = 50

export function DotMapGrid({ items }: DotMapGridProps) {
  // Group items by (jlptLevel, masteryState)
  const cells = new Map<string, FrontierItem[]>()
  for (const item of items) {
    const key = `${item.jlptLevel}|${item.masteryState}`
    const arr = cells.get(key)
    if (arr) {
      arr.push(item)
    } else {
      cells.set(key, [item])
    }
  }

  return (
    <Box style={{ overflowX: 'auto' }}>
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(${JLPT_LEVELS.length}, 1fr)`,
          gridTemplateRows: `auto repeat(${MASTERY_ORDER.length}, auto)`,
          gap: 1,
          minWidth: 400,
        }}
      >
        {/* Header row */}
        <Box />
        {JLPT_LEVELS.map((level) => (
          <Flex key={level} justify="center" py="1">
            <Text size="1" weight="bold" color="gray">
              {level}
            </Text>
          </Flex>
        ))}

        {/* Data rows */}
        {MASTERY_ORDER.map((state) => (
          <MasteryRow
            key={state}
            state={state}
            cells={cells}
          />
        ))}
      </Box>
    </Box>
  )
}

function MasteryRow({
  state,
  cells,
}: {
  state: string
  cells: Map<string, FrontierItem[]>
}) {
  return (
    <>
      {/* Row label */}
      <Flex align="center" pr="2" py="1">
        <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
          {MASTERY_LABELS[state]}
        </Text>
      </Flex>

      {/* Cells */}
      {JLPT_LEVELS.map((level) => {
        const key = `${level}|${state}`
        const cellItems = cells.get(key) ?? []
        return (
          <DotCell key={key} items={cellItems} />
        )
      })}
    </>
  )
}

function DotCell({ items }: { items: FrontierItem[] }) {
  const visible = items.slice(0, DOT_CAP)
  const overflow = items.length - DOT_CAP

  return (
    <Flex
      wrap="wrap"
      gap="1"
      p="1"
      align="start"
      style={{
        minHeight: 24,
        backgroundColor: items.length > 0 ? 'var(--gray-2)' : undefined,
        borderRadius: 'var(--radius-1)',
      }}
    >
      {visible.map((item) => (
        <Tooltip
          key={`${item.itemType}-${item.id}`}
          content={item.surfaceForm ?? item.patternId ?? `#${item.id}`}
        >
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor:
                item.itemType === 'lexical' ? 'var(--accent-9)' : 'var(--purple-9)',
              flexShrink: 0,
            }}
          />
        </Tooltip>
      ))}
      {overflow > 0 && (
        <Text size="1" color="gray">
          +{overflow}
        </Text>
      )}
    </Flex>
  )
}
