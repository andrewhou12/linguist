// ── Mastery State Machine ──

export enum MasteryState {
  Unseen = 'unseen',
  Introduced = 'introduced',
  Apprentice1 = 'apprentice_1',
  Apprentice2 = 'apprentice_2',
  Apprentice3 = 'apprentice_3',
  Apprentice4 = 'apprentice_4',
  Journeyman = 'journeyman',
  Expert = 'expert',
  Master = 'master',
  Burned = 'burned',
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
export type ReviewModality = 'recognition' | 'production' | 'cloze'
export type ItemType = 'lexical' | 'grammar'

// ── FSRS ──

export interface FsrsState {
  due: string // ISO date string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: number // FSRS State enum value (New=0, Learning=1, Review=2, Relearning=3)
  last_review?: string // ISO date string
}

// ── IPC Channel Names ──

export const IPC_CHANNELS = {
  // Reviews
  REVIEW_GET_QUEUE: 'review:get-queue',
  REVIEW_SUBMIT: 'review:submit',
  REVIEW_GET_SUMMARY: 'review:get-summary',

  // Word Bank
  WORDBANK_LIST: 'wordbank:list',
  WORDBANK_GET: 'wordbank:get',
  WORDBANK_ADD: 'wordbank:add',
  WORDBANK_UPDATE: 'wordbank:update',
  WORDBANK_SEARCH: 'wordbank:search',

  // Conversation
  CONVERSATION_PLAN: 'conversation:plan',
  CONVERSATION_SEND: 'conversation:send',
  CONVERSATION_END: 'conversation:end',
  CONVERSATION_LIST: 'conversation:list',

  // ToM
  TOM_RUN_ANALYSIS: 'tom:run-analysis',
  TOM_GET_BRIEF: 'tom:get-brief',
  TOM_GET_INFERENCES: 'tom:get-inferences',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

// ── IPC Payload Types ──

export interface ReviewSubmission {
  itemId: number
  itemType: ItemType
  grade: ReviewGrade
  modality: ReviewModality
  sessionId?: string
}

export interface ReviewQueueItem {
  id: number
  itemType: ItemType
  surfaceForm: string
  reading?: string | null
  meaning: string
  modality: ReviewModality
  masteryState: MasteryState
  overdueDays: number
}

export interface ReviewSummary {
  totalReviewed: number
  accuracy: number
  newItemsAdded: number
  masteryChanges: Array<{
    itemId: number
    itemType: ItemType
    from: MasteryState
    to: MasteryState
  }>
}

export interface WordBankEntry {
  id: number
  surfaceForm: string
  reading: string | null
  meaning: string
  partOfSpeech: string | null
  masteryState: MasteryState
  recognitionFsrs: FsrsState
  productionFsrs: FsrsState
  firstSeen: string
  lastReviewed: string | null
  exposureCount: number
  productionCount: number
  tags: string[]
  source: string
}

export interface WordBankFilters {
  masteryState?: MasteryState
  tag?: string
  search?: string
  dueOnly?: boolean
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface SessionPlan {
  targetVocabulary: number[]
  targetGrammar: number[]
  difficultyLevel: string
  register: 'casual' | 'polite'
  sessionFocus: string
}

export interface TomBrief {
  priorityTargets: Array<{ itemId: number; reason: string }>
  confusionPairs: Array<{ itemIds: number[]; description: string }>
  avoidancePatterns: Array<{ itemId: number; sessionsAvoided: number }>
  regressions: Array<{ itemId: number; recentGrades: ReviewGrade[] }>
  recommendedDifficulty: string
  notes: string
}

export interface PostSessionAnalysis {
  targetsHit: number[]
  errorsLogged: Array<{
    itemId: number
    errorType: string
    contextQuote: string
  }>
  avoidanceEvents: Array<{
    itemId: number
    contextQuote: string
  }>
  newItemsEncountered: Array<{
    surfaceForm: string
    contextQuote: string
  }>
  overallAssessment: string
}
