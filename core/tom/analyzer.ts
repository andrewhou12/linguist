import type {
  MasteryState,
  ReviewGrade,
  TomBrief,
  ExpandedTomBrief,
  FsrsState,
  LearningModality,
  PragmaticState,
  ItemType,
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

export interface ModalityItemData {
  itemId: number
  recognitionFsrs: FsrsState
  productionFsrs: FsrsState
  readingExposures: number
  listeningExposures: number
  speakingProductions: number
  writingProductions: number
}

export interface GrammarTransferData {
  itemId: number
  patternId: string
  masteryState: MasteryState
  contextCount: number
}

export interface ExpandedBriefInput {
  items: ItemReviewHistory[]
  errors: ErrorRecord[]
  modalityData: ModalityItemData[]
  grammarTransferData: GrammarTransferData[]
  pragmaticState: PragmaticState | null
  recommendedDifficulty: string
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

// ── New detectors ──

function getRetrievability(fsrs: FsrsState): number {
  if (fsrs.reps === 0) return 0
  const now = Date.now()
  const due = new Date(fsrs.due).getTime()
  if (now <= due) return 1.0
  const elapsedDays = (now - due) / (1000 * 60 * 60 * 24) + fsrs.scheduled_days
  if (fsrs.stability <= 0) return 0
  return Math.max(0, Math.min(1, Math.pow(1 + elapsedDays / (9 * fsrs.stability), -1)))
}

export function detectModalityGap(
  items: ModalityItemData[]
): Array<{ modality: LearningModality; currentLevel: number; strongestLevel: number; gap: number }> {
  if (items.length === 0) return []

  // Compute average retrievability per modality dimension
  const readingItems = items.filter((i) => i.readingExposures > 0)
  const writingItems = items.filter((i) => i.writingProductions > 0)
  const listeningItems = items.filter((i) => i.listeningExposures > 0)
  const speakingItems = items.filter((i) => i.speakingProductions > 0)

  const readingAvg =
    readingItems.length > 0
      ? readingItems.reduce((s, i) => s + getRetrievability(i.recognitionFsrs), 0) / readingItems.length
      : 0
  const writingAvg =
    writingItems.length > 0
      ? writingItems.reduce((s, i) => s + getRetrievability(i.productionFsrs), 0) / writingItems.length
      : 0
  const listeningAvg =
    listeningItems.length > 0
      ? listeningItems.reduce((s, i) => s + getRetrievability(i.recognitionFsrs), 0) / listeningItems.length
      : 0
  const speakingAvg =
    speakingItems.length > 0
      ? speakingItems.reduce((s, i) => s + getRetrievability(i.productionFsrs), 0) / speakingItems.length
      : 0

  const modalities: Array<{ modality: LearningModality; level: number }> = [
    { modality: 'reading', level: readingAvg },
    { modality: 'writing', level: writingAvg },
    { modality: 'listening', level: listeningAvg },
    { modality: 'speaking', level: speakingAvg },
  ]

  const strongest = Math.max(...modalities.map((m) => m.level))
  const GAP_THRESHOLD = 0.2

  return modalities
    .filter((m) => strongest - m.level > GAP_THRESHOLD)
    .map((m) => ({
      modality: m.modality,
      currentLevel: Math.round(m.level * 100) / 100,
      strongestLevel: Math.round(strongest * 100) / 100,
      gap: Math.round((strongest - m.level) * 100) / 100,
    }))
}

export function detectTransferGap(
  grammarItems: GrammarTransferData[]
): Array<{ itemId: number; patternId: string; contextCount: number; needed: number }> {
  const REQUIRED_CONTEXTS = 3
  return grammarItems
    .filter((item) => {
      const state = item.masteryState
      return (
        (state === 'journeyman' || state === 'expert' || state === 'master') &&
        item.contextCount < REQUIRED_CONTEXTS
      )
    })
    .map((item) => ({
      itemId: item.itemId,
      patternId: item.patternId,
      contextCount: item.contextCount,
      needed: REQUIRED_CONTEXTS,
    }))
}

// ── Original daily brief (preserved for backward compat) ──

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

// ── Expanded daily brief with all 5 detectors ──

export function generateExpandedDailyBrief(input: ExpandedBriefInput): ExpandedTomBrief {
  const { items, errors, modalityData, grammarTransferData, pragmaticState, recommendedDifficulty } = input

  // Run all 5 detectors
  const avoidance = detectAvoidance(items)
  const confusionPairs = detectConfusionPairs(errors)
  const regressions = detectRegression(items)
  const modalityGaps = detectModalityGap(modalityData)
  const transferGaps = detectTransferGap(grammarTransferData)

  const priorityTargets: TomBrief['priorityTargets'] = [
    ...avoidance.map((a) => ({
      itemId: a.itemId,
      reason: `Avoided in conversation for ${a.sessionsAvoided} sessions`,
    })),
    ...regressions.map((r) => ({
      itemId: r.itemId,
      reason: `Regression detected: recent grades ${r.recentGrades.join(', ')}`,
    })),
    ...transferGaps.slice(0, 3).map((t) => ({
      itemId: t.itemId,
      reason: `Needs transfer testing: seen in ${t.contextCount}/${t.needed} contexts`,
    })),
  ]

  // Build notes
  const notesParts: string[] = []
  if (avoidance.length > 0) {
    notesParts.push(`${avoidance.length} item(s) flagged for avoidance in conversation.`)
  }
  if (modalityGaps.length > 0) {
    const gapNames = modalityGaps.map((g) => g.modality).join(', ')
    notesParts.push(`Modality gaps detected in: ${gapNames}.`)
  }
  if (transferGaps.length > 0) {
    notesParts.push(`${transferGaps.length} grammar item(s) need novel context exposure.`)
  }
  if (notesParts.length === 0) {
    notesParts.push('No significant patterns detected.')
  }

  // Pragmatic insights
  const pragmaticInsights = pragmaticState
    ? {
        registerAccuracy: {
          casual: pragmaticState.casualAccuracy,
          polite: pragmaticState.politeAccuracy,
        },
        strategyCount: {
          circumlocution: pragmaticState.circumlocutionCount,
          l1Fallback: pragmaticState.l1FallbackCount,
          silence: pragmaticState.silenceEvents,
        },
        avoidedPatterns: pragmaticState.avoidedGrammarPatterns,
      }
    : {
        registerAccuracy: { casual: 0, polite: 0 },
        strategyCount: { circumlocution: 0, l1Fallback: 0, silence: 0 },
        avoidedPatterns: [],
      }

  // Curriculum suggestions from ToM analysis
  const curriculumSuggestions: ExpandedTomBrief['curriculumSuggestions'] = []
  for (const gap of modalityGaps) {
    curriculumSuggestions.push({
      itemType: 'lexical' as ItemType,
      reason: `Strengthen ${gap.modality} modality (gap: ${gap.gap})`,
      priority: gap.gap,
    })
  }
  for (const regression of regressions.slice(0, 2)) {
    curriculumSuggestions.push({
      itemType: 'lexical' as ItemType,
      reason: `Reinforce regressing item ${regression.itemId}`,
      priority: 0.5,
    })
  }

  return {
    priorityTargets,
    confusionPairs,
    avoidancePatterns: avoidance,
    regressions,
    recommendedDifficulty,
    notes: notesParts.join(' '),
    modalityGaps,
    transferGaps,
    pragmaticInsights,
    curriculumSuggestions,
  }
}
