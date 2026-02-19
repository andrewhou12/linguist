import { MasteryState, type ReviewGrade } from '@shared/types'

export interface MasteryContext {
  currentState: MasteryState
  grade: ReviewGrade
  modality: 'recognition' | 'production' | 'cloze'
  hasProductionEvidence: boolean // true if item has any logged production event
  productionCount: number
}

const PROMOTION_MAP: Partial<Record<MasteryState, MasteryState>> = {
  [MasteryState.Unseen]: MasteryState.Introduced,
  [MasteryState.Introduced]: MasteryState.Apprentice1,
  [MasteryState.Apprentice1]: MasteryState.Apprentice2,
  [MasteryState.Apprentice2]: MasteryState.Apprentice3,
  [MasteryState.Apprentice3]: MasteryState.Apprentice4,
  [MasteryState.Apprentice4]: MasteryState.Journeyman, // gated by production evidence
  [MasteryState.Journeyman]: MasteryState.Expert,
  [MasteryState.Expert]: MasteryState.Master,
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
  const { currentState, grade, hasProductionEvidence } = ctx

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

  // Critical rule: cannot advance past apprentice_4 without production evidence
  if (
    currentState === MasteryState.Apprentice4 &&
    nextState === MasteryState.Journeyman &&
    !hasProductionEvidence
  ) {
    return MasteryState.Apprentice4
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
