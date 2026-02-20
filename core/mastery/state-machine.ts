import { MasteryState, type ReviewGrade } from '@shared/types'

export interface MasteryContext {
  currentState: MasteryState
  grade: ReviewGrade
  modality: 'recognition' | 'production' | 'cloze'
  hasProductionEvidence: boolean // true if item has any logged production event
  productionCount: number
  productionWeight: number // accumulated production weight (drill=0.5, conversation=1.0)
  contextCount: number // distinct context types the item has been seen in
  novelContextCount: number // contexts different from where item was first learned (grammar only)
}

const PROMOTION_MAP: Partial<Record<MasteryState, MasteryState>> = {
  [MasteryState.Unseen]: MasteryState.Introduced,
  [MasteryState.Introduced]: MasteryState.Apprentice1,
  [MasteryState.Apprentice1]: MasteryState.Apprentice2,
  [MasteryState.Apprentice2]: MasteryState.Apprentice3,
  [MasteryState.Apprentice3]: MasteryState.Apprentice4,
  [MasteryState.Apprentice4]: MasteryState.Journeyman, // gated by production weight
  [MasteryState.Journeyman]: MasteryState.Expert, // gated by context breadth
  [MasteryState.Expert]: MasteryState.Master, // grammar: gated by novel context (transfer)
  [MasteryState.Master]: MasteryState.Burned,
}

const DEMOTION_MAP: Partial<Record<MasteryState, MasteryState>> = {
  [MasteryState.Apprentice2]: MasteryState.Apprentice1,
  [MasteryState.Apprentice3]: MasteryState.Apprentice2,
  [MasteryState.Apprentice4]: MasteryState.Apprentice3,
  [MasteryState.Journeyman]: MasteryState.Apprentice4,
  [MasteryState.Expert]: MasteryState.Journeyman,
  [MasteryState.Master]: MasteryState.Expert,
  [MasteryState.Burned]: MasteryState.Master,
}

export function computeNextMasteryState(ctx: MasteryContext): MasteryState {
  const { currentState, grade } = ctx

  // Demotion on "again"
  if (grade === 'again') {
    return DEMOTION_MAP[currentState] ?? currentState
  }

  // No promotion on "hard" — stay in same state
  if (grade === 'hard') {
    return currentState
  }

  // Promotion on "good" or "easy"
  const nextState = PROMOTION_MAP[currentState]
  if (!nextState) {
    return currentState
  }

  // Gate: apprentice_4 → journeyman requires productionWeight >= 1.0
  if (currentState === MasteryState.Apprentice4 && nextState === MasteryState.Journeyman) {
    if (ctx.productionWeight < 1.0) {
      return MasteryState.Apprentice4
    }
  }

  // Gate: journeyman → expert requires contextCount >= 3
  if (currentState === MasteryState.Journeyman && nextState === MasteryState.Expert) {
    if (ctx.contextCount < 3) {
      return MasteryState.Journeyman
    }
  }

  // Gate: expert → master (grammar) requires novelContextCount >= 2
  if (currentState === MasteryState.Expert && nextState === MasteryState.Master) {
    if (ctx.novelContextCount < 2) {
      return MasteryState.Expert
    }
  }

  return nextState
}

export function isApprentice(state: MasteryState): boolean {
  return [
    MasteryState.Apprentice1,
    MasteryState.Apprentice2,
    MasteryState.Apprentice3,
    MasteryState.Apprentice4,
  ].includes(state)
}

export function isActive(state: MasteryState): boolean {
  return state !== MasteryState.Unseen && state !== MasteryState.Burned
}
