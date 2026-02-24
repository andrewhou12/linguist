import { Flex, Text } from '@radix-ui/themes'
import type { FrontierData } from '@linguist/shared/types'
import { DotMapGrid } from './components/dot-map-grid'
import { DotMapLegend } from './components/dot-map-legend'

export function DotMapView({ data }: { data: FrontierData }) {
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
        Each dot is one item. Columns = CEFR level. Rows = mastery state.
      </Text>
    </Flex>
  )
}
