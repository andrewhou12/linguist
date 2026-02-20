import { Flex, Text } from '@radix-ui/themes'
import type { FrontierData } from '@shared/types'
import { DotMapGrid } from './components/dot-map-grid'
import { DotMapLegend } from './components/dot-map-legend'

interface DotMapViewProps {
  data: FrontierData
}

export function DotMapView({ data }: DotMapViewProps) {
  const { items } = data

  if (items.length === 0) {
    return (
      <Text size="2" color="gray">
        No items in your knowledge base yet. Complete onboarding or add items to see the map.
      </Text>
    )
  }

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Text size="2" weight="bold" color="gray">
          Knowledge Map
        </Text>
        <DotMapLegend />
      </Flex>
      <DotMapGrid items={items} />
      <Text size="1" color="gray">
        Each dot is one item. Columns = JLPT level. Rows = mastery state.
      </Text>
    </Flex>
  )
}
