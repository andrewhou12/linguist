import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
  type Grade,
  type RecordLogItem,
  Rating,
} from 'ts-fsrs'
import type { FsrsState, ReviewGrade, ReviewQueueItem } from '@shared/types'

const GRADE_MAP: Record<ReviewGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

const params = generatorParameters({ request_retention: 0.9 })
const scheduler = fsrs(params)

export function createInitialFsrsState(): FsrsState {
  const card = createEmptyCard()
  return cardToFsrsState(card)
}

export function scheduleReview(
  state: FsrsState,
  grade: ReviewGrade
): { nextState: FsrsState; interval: number } {
  const card = fsrsStateToCard(state)
  const now = new Date()
  const result: RecordLogItem = scheduler.repeat(card, now)[GRADE_MAP[grade]]

  return {
    nextState: cardToFsrsState(result.card),
    interval: result.card.scheduled_days,
  }
}

export function computeReviewQueue(
  items: Array<{
    id: number
    itemType: 'lexical' | 'grammar'
    surfaceForm: string
    reading?: string | null
    meaning: string
    masteryState: string
    recognitionFsrs: FsrsState
    productionFsrs: FsrsState
  }>
): ReviewQueueItem[] {
  const now = new Date()
  const queue: ReviewQueueItem[] = []

  for (const item of items) {
    const recognitionDue = new Date(item.recognitionFsrs.due)
    const productionDue = new Date(item.productionFsrs.due)

    if (recognitionDue <= now) {
      queue.push({
        id: item.id,
        itemType: item.itemType,
        surfaceForm: item.surfaceForm,
        reading: item.reading,
        meaning: item.meaning,
        modality: 'recognition',
        masteryState: item.masteryState as ReviewQueueItem['masteryState'],
        overdueDays: Math.floor(
          (now.getTime() - recognitionDue.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })
    }

    if (productionDue <= now) {
      queue.push({
        id: item.id,
        itemType: item.itemType,
        surfaceForm: item.surfaceForm,
        reading: item.reading,
        meaning: item.meaning,
        modality: 'production',
        masteryState: item.masteryState as ReviewQueueItem['masteryState'],
        overdueDays: Math.floor(
          (now.getTime() - productionDue.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })
    }
  }

  // Sort by most overdue first
  queue.sort((a, b) => b.overdueDays - a.overdueDays)

  return queue
}

// ── Helpers ──

function cardToFsrsState(card: Card): FsrsState {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review
      ? new Date(card.last_review).toISOString()
      : undefined,
  }
}

function fsrsStateToCard(state: FsrsState): Card {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsed_days,
    scheduled_days: state.scheduled_days,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state,
    last_review: state.last_review ? new Date(state.last_review) : undefined,
  } as Card
}
