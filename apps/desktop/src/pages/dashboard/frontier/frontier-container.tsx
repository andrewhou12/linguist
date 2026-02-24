import { useState } from 'react'
import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes'
import { Skeleton } from '../../../components/skeleton'
import { useFrontier } from '../../../hooks/use-frontier'
import { ViewToggle, type FrontierView } from './view-toggle'
import { LevelBarsView } from './level-bars-view'
import { DotMapView } from './dot-map-view'
import { RadarLevelsView } from './radar-levels-view'

export function FrontierContainer() {
  const { data, isLoading } = useFrontier()
  const [view, setView] = useState<FrontierView>('levels')

  if (isLoading) {
    return (
      <Card mt="5">
        <Flex direction="column" gap="3">
          <Skeleton width={160} height={18} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Flex key={i} gap="3" align="center">
              <Skeleton width={32} height={14} />
              <Skeleton width="100%" height={20} borderRadius={4} />
            </Flex>
          ))}
        </Flex>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card mt="5">
        <Text size="2" color="gray">
          Complete onboarding to see your learning frontier.
        </Text>
      </Card>
    )
  }

  return (
    <Card mt="5">
      <Flex justify="between" align="center" mb="4">
        <Heading size="4">Learning Frontier</Heading>
        <ViewToggle value={view} onChange={setView} />
      </Flex>

      <Box>
        {view === 'levels' && <LevelBarsView data={data} />}
        {view === 'map' && <DotMapView data={data} />}
        {view === 'skills' && <RadarLevelsView data={data} />}
      </Box>
    </Card>
  )
}
