import { Flex, Text, Box, Separator } from '@radix-ui/themes'
import type { FrontierData } from '@shared/types'
import { RadarChart } from './components/radar-chart'
import { LevelProgressBar } from './components/level-progress-bar'

interface RadarLevelsViewProps {
  data: FrontierData
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function RadarLevelsView({ data }: RadarLevelsViewProps) {
  const { bubble, profile } = data

  return (
    <Flex direction="column" gap="4">
      <Flex gap="5" wrap="wrap" align="start">
        {/* Radar chart */}
        <Flex direction="column" align="center" gap="2" style={{ flex: '1 1 200px' }}>
          <Text size="2" weight="bold" color="gray">
            Skill Balance
          </Text>
          <Box style={{ width: '100%', maxWidth: 220 }}>
            <RadarChart
              reading={profile.readingLevel}
              writing={profile.writingLevel}
              listening={profile.listeningLevel}
              speaking={profile.speakingLevel}
            />
          </Box>
          <Flex gap="3" wrap="wrap" justify="center">
            <SkillLabel label="Reading" value={profile.readingLevel} />
            <SkillLabel label="Writing" value={profile.writingLevel} />
            <SkillLabel label="Listening" value={profile.listeningLevel} />
            <SkillLabel label="Speaking" value={profile.speakingLevel} />
          </Flex>
        </Flex>

        {/* Level bars */}
        <Flex direction="column" gap="1" style={{ flex: '1 1 250px' }}>
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
        </Flex>
      </Flex>
    </Flex>
  )
}

function SkillLabel({ label, value }: { label: string; value: number }) {
  return (
    <Text size="1" color="gray">
      {label}: {Math.round(value * 100)}%
    </Text>
  )
}

function isAbove(level: string, frontier: string): boolean {
  const li = LEVEL_ORDER.indexOf(level)
  const fi = LEVEL_ORDER.indexOf(frontier)
  if (li === -1 || fi === -1) return false
  return li > fi
}
