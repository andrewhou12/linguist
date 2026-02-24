import { Flex, Text, Separator } from '@radix-ui/themes'
import type { FrontierData } from '@shared/types'
import { LevelProgressBar } from './components/level-progress-bar'
import { MasteryPipeline } from './components/mastery-pipeline'
import { CeilingComparison } from './components/ceiling-comparison'

interface LevelBarsViewProps {
  data: FrontierData
}

export function LevelBarsView({ data }: LevelBarsViewProps) {
  const { bubble, profile, masteryDistribution } = data

  return (
    <Flex direction="column" gap="4">
      {/* Level Bars */}
      <Flex direction="column" gap="1">
        <Text size="2" weight="bold" color="gray" mb="1">
          Level Coverage
        </Text>
        {bubble.levelBreakdowns.map((level) => (
          <LevelProgressBar
            key={level.level}
            level={level}
            isCurrent={level.level === bubble.currentLevel}
            isFrontier={level.level === bubble.frontierLevel}
            isAboveFrontier={isAbove(level.level, bubble.frontierLevel)}
          />
        ))}
        <Flex gap="3" mt="1">
          <Text size="1" color="gray">
            Dark = production ready | Light = recognition
          </Text>
        </Flex>
      </Flex>

      <Separator size="4" />

      {/* Mastery Pipeline */}
      <Flex direction="column" gap="2">
        <Text size="2" weight="bold" color="gray">
          Mastery Distribution
        </Text>
        <MasteryPipeline distribution={masteryDistribution} />
      </Flex>

      <Separator size="4" />

      {/* Ceiling Comparison */}
      <Flex direction="column" gap="2">
        <Text size="2" weight="bold" color="gray">
          Ceiling
        </Text>
        <CeilingComparison
          comprehensionCeiling={profile.comprehensionCeiling}
          productionCeiling={profile.productionCeiling}
        />
      </Flex>
    </Flex>
  )
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function isAbove(level: string, frontier: string): boolean {
  const li = LEVEL_ORDER.indexOf(level)
  const fi = LEVEL_ORDER.indexOf(frontier)
  if (li === -1 || fi === -1) return false
  return li > fi
}
