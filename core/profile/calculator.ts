import type { FsrsState } from '@shared/types'

// ── Input types ──

export interface ProfileItemInput {
  id: number
  itemType: 'lexical' | 'grammar'
  cefrLevel: string | null
  masteryState: string
  recognitionFsrs: FsrsState
  productionFsrs: FsrsState
  writingProductions: number
  readingExposures: number
  listeningExposures: number
  speakingProductions: number
}

export interface ProfileCalculationInput {
  items: ProfileItemInput[]
  totalReviewEvents: number
  lastActiveDate: string | null
  previousStreak: number
  previousLongestStreak: number
  previousLastActiveDate: string | null
}

export interface ProfileUpdate {
  computedLevel: string
  comprehensionCeiling: string
  productionCeiling: string
  readingLevel: number
  listeningLevel: number
  speakingLevel: number
  writingLevel: number
  currentStreak: number
  longestStreak: number
}

// ── CEFR level ordering ──

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
type CefrLevel = (typeof CEFR_LEVELS)[number]

function cefrIndex(level: string): number {
  const idx = CEFR_LEVELS.indexOf(level as CefrLevel)
  return idx >= 0 ? idx : 0
}

function isValidCefr(level: string | null): level is CefrLevel {
  return level !== null && CEFR_LEVELS.includes(level as CefrLevel)
}

// ── Retrievability calculation ──

function getRetrievability(fsrs: FsrsState): number {
  if (fsrs.reps === 0) return 0
  const now = Date.now()
  const due = new Date(fsrs.due).getTime()
  if (now <= due) return 1.0

  // Approximate retrievability decay: R = (1 + elapsed/9*S)^-1
  const elapsedDays = (now - due) / (1000 * 60 * 60 * 24) + fsrs.scheduled_days
  if (fsrs.stability <= 0) return 0
  const retrievability = Math.pow(1 + elapsedDays / (9 * fsrs.stability), -1)
  return Math.max(0, Math.min(1, retrievability))
}

// ── Core calculation ──

export function recalculateProfile(input: ProfileCalculationInput): ProfileUpdate {
  const { items } = input

  // Group items by CEFR level
  const byLevel = new Map<string, ProfileItemInput[]>()
  for (const item of items) {
    const level = isValidCefr(item.cefrLevel) ? item.cefrLevel : 'A1'
    const group = byLevel.get(level) ?? []
    group.push(item)
    byLevel.set(level, group)
  }

  // Compute comprehension ceiling: highest level where avg recognition retrievability > 0.80
  let comprehensionCeiling = 'A1'
  for (const level of CEFR_LEVELS) {
    const levelItems = byLevel.get(level)
    if (!levelItems || levelItems.length === 0) continue
    const avgRecognition =
      levelItems.reduce((sum, item) => sum + getRetrievability(item.recognitionFsrs), 0) /
      levelItems.length
    if (avgRecognition > 0.8) {
      comprehensionCeiling = level
    } else {
      break
    }
  }

  // Compute production ceiling: highest level where avg production retrievability > 0.60
  let productionCeiling = 'A1'
  for (const level of CEFR_LEVELS) {
    const levelItems = byLevel.get(level)
    if (!levelItems || levelItems.length === 0) continue
    const avgProduction =
      levelItems.reduce((sum, item) => sum + getRetrievability(item.productionFsrs), 0) /
      levelItems.length
    if (avgProduction > 0.6) {
      productionCeiling = level
    } else {
      break
    }
  }

  // Computed level = max of the two ceilings
  const computedLevel =
    cefrIndex(comprehensionCeiling) >= cefrIndex(productionCeiling)
      ? comprehensionCeiling
      : productionCeiling

  // Reading level: weighted avg of recognition retrievability across all items
  const allWithRecognition = items.filter((i) => i.recognitionFsrs.reps > 0)
  const readingLevel =
    allWithRecognition.length > 0
      ? allWithRecognition.reduce((sum, i) => sum + getRetrievability(i.recognitionFsrs), 0) /
        allWithRecognition.length
      : 0

  // Writing level: weighted avg of production retrievability for items with writing productions
  const withWriting = items.filter((i) => i.writingProductions > 0)
  const writingLevel =
    withWriting.length > 0
      ? withWriting.reduce((sum, i) => sum + getRetrievability(i.productionFsrs), 0) /
        withWriting.length
      : 0

  // Listening and speaking remain 0 until V2 voice
  const listeningLevel = 0
  const speakingLevel = 0

  // Streak calculation
  const streak = computeStreak(
    input.lastActiveDate,
    input.previousStreak,
    input.previousLastActiveDate
  )

  return {
    computedLevel,
    comprehensionCeiling,
    productionCeiling,
    readingLevel: Math.round(readingLevel * 100) / 100,
    listeningLevel,
    speakingLevel,
    writingLevel: Math.round(writingLevel * 100) / 100,
    currentStreak: streak.current,
    longestStreak: Math.max(streak.current, input.previousLongestStreak),
  }
}

function computeStreak(
  lastActiveDate: string | null,
  previousStreak: number,
  previousLastActiveDate: string | null
): { current: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!lastActiveDate) {
    return { current: 1 } // First activity today
  }

  const lastActive = new Date(previousLastActiveDate ?? lastActiveDate)
  lastActive.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Same day — streak unchanged
    return { current: Math.max(previousStreak, 1) }
  } else if (diffDays === 1) {
    // Consecutive day — increment
    return { current: previousStreak + 1 }
  } else {
    // Gap — streak resets
    return { current: 1 }
  }
}
