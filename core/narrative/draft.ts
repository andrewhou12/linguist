import type { FrontierData, TomBrief, NarrativeDraft, MasteryState } from '@shared/types'

interface ModalityEntry {
  name: string
  value: number
}

function getModalities(profile: FrontierData['profile']): ModalityEntry[] {
  return [
    { name: 'reading', value: profile.readingLevel },
    { name: 'listening', value: profile.listeningLevel },
    { name: 'speaking', value: profile.speakingLevel },
    { name: 'writing', value: profile.writingLevel },
  ]
}

function findCoverage(
  bubble: FrontierData['bubble'],
  level: string
): number {
  const breakdown = bubble.levelBreakdowns.find((b) => b.level === level)
  return breakdown?.coverage ?? 0
}

function countActive(distribution: Record<string, number>): number {
  const unseen = distribution['unseen' as MasteryState] ?? 0
  const total = Object.values(distribution).reduce((sum, n) => sum + n, 0)
  return total - unseen
}

function buildTemplateText(draft: Omit<NarrativeDraft, 'templateText'>): string {
  const sentences: string[] = []

  const coveragePct = Math.round(draft.levelCoverage * 100)
  sentences.push(
    `You're currently at ${draft.level} with ${coveragePct}% coverage.`
  )

  sentences.push(
    `Your strongest skill is ${draft.strongest} — ${draft.weakest} needs more practice.`
  )

  const frontierPct = Math.round(draft.frontierCoverage * 100)
  if (draft.frontierLevel !== draft.level) {
    sentences.push(
      `${draft.frontierLevel} is your frontier at ${frontierPct}% coverage.`
    )
  }

  const attentionCount =
    draft.gapCount + draft.avoidanceCount + draft.regressionCount
  if (attentionCount > 0) {
    sentences.push(`${attentionCount} items need attention.`)
  }

  if (draft.streak > 1) {
    sentences.push(`You're on a ${draft.streak}-day streak!`)
  }

  return sentences.join(' ')
}

export function buildNarrativeDraft(
  frontier: FrontierData,
  brief: TomBrief | null
): NarrativeDraft {
  const modalities = getModalities(frontier.profile)

  const sorted = [...modalities].sort((a, b) => b.value - a.value)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]

  const level = frontier.bubble.currentLevel
  const frontierLevel = frontier.bubble.frontierLevel
  const levelCoverage = findCoverage(frontier.bubble, level)
  const frontierCoverage = findCoverage(frontier.bubble, frontierLevel)

  const totalItems = Object.values(frontier.masteryDistribution).reduce(
    (sum, n) => sum + n,
    0
  )
  const activeItems = countActive(frontier.masteryDistribution)

  const gapCount = frontier.bubble.gapsInCurrentLevel.length
  const avoidanceCount = brief?.avoidancePatterns.length ?? 0
  const confusionCount = brief?.confusionPairs.length ?? 0
  const regressionCount = brief?.regressions.length ?? 0

  const partial: Omit<NarrativeDraft, 'templateText'> = {
    level,
    levelCoverage,
    frontierLevel,
    frontierCoverage,
    strongest: strongest.name,
    strongestValue: strongest.value,
    weakest: weakest.name,
    weakestValue: weakest.value,
    totalItems,
    activeItems,
    streak: frontier.profile.currentStreak,
    gapCount,
    avoidanceCount,
    confusionCount,
    regressionCount,
  }

  return {
    ...partial,
    templateText: buildTemplateText(partial),
  }
}
