import type {
  MasteryState,
  ReviewGrade,
  TomBrief,
} from '@shared/types'

// ── Input types for ToM analysis ──

export interface ItemReviewHistory {
  itemId: number
  masteryState: MasteryState
  productionCount: number
  conversationProductionCount: number
  sessionsInCurrentState: number
  recentGrades: ReviewGrade[]
}

export interface ErrorRecord {
  itemId: number
  sessionId: string
  errorType: string
}

// ── Detectors ──

export function detectAvoidance(
  items: ItemReviewHistory[]
): Array<{ itemId: number; sessionsAvoided: number }> {
  return items
    .filter(
      (item) =>
        item.masteryState === 'journeyman' &&
        item.sessionsInCurrentState >= 3 &&
        item.conversationProductionCount === 0
    )
    .map((item) => ({
      itemId: item.itemId,
      sessionsAvoided: item.sessionsInCurrentState,
    }))
}

export function detectConfusionPairs(
  errors: ErrorRecord[]
): Array<{ itemIds: number[]; description: string }> {
  // Group errors by session, find items that co-occur in errors
  const sessionErrors = new Map<string, number[]>()
  for (const error of errors) {
    const existing = sessionErrors.get(error.sessionId) ?? []
    existing.push(error.itemId)
    sessionErrors.set(error.sessionId, existing)
  }

  const pairCounts = new Map<string, number>()
  for (const itemIds of sessionErrors.values()) {
    for (let i = 0; i < itemIds.length; i++) {
      for (let j = i + 1; j < itemIds.length; j++) {
        const key = [Math.min(itemIds[i], itemIds[j]), Math.max(itemIds[i], itemIds[j])].join(',')
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }

  return Array.from(pairCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([key]) => ({
      itemIds: key.split(',').map(Number),
      description: `Items confused together in ${pairCounts.get(key)} sessions`,
    }))
}

export function detectRegression(
  items: ItemReviewHistory[]
): Array<{ itemId: number; recentGrades: ReviewGrade[] }> {
  return items
    .filter((item) => {
      if (item.masteryState !== 'master' && item.masteryState !== 'expert') {
        return false
      }
      const last3 = item.recentGrades.slice(-3)
      return last3.some((g) => g === 'again' || g === 'hard')
    })
    .map((item) => ({
      itemId: item.itemId,
      recentGrades: item.recentGrades.slice(-3),
    }))
}

export function generateDailyBrief(
  items: ItemReviewHistory[],
  errors: ErrorRecord[],
  recommendedDifficulty: string
): TomBrief {
  const avoidance = detectAvoidance(items)
  const confusionPairs = detectConfusionPairs(errors)
  const regressions = detectRegression(items)

  const priorityTargets: TomBrief['priorityTargets'] = [
    ...avoidance.map((a) => ({
      itemId: a.itemId,
      reason: `Avoided in conversation for ${a.sessionsAvoided} sessions`,
    })),
    ...regressions.map((r) => ({
      itemId: r.itemId,
      reason: `Regression detected: recent grades ${r.recentGrades.join(', ')}`,
    })),
  ]

  const notes = avoidance.length > 0
    ? `Learner has ${avoidance.length} item(s) flagged for avoidance in conversation.`
    : 'No avoidance patterns detected.'

  return {
    priorityTargets,
    confusionPairs,
    avoidancePatterns: avoidance,
    regressions,
    recommendedDifficulty,
    notes,
  }
}
