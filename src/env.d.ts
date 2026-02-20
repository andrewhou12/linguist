import type {
  ReviewSubmission,
  ReviewQueueItem,
  ReviewSummary,
  WordBankEntry,
  WordBankFilters,
  ConversationMessage,
  SessionPlan,
  TomBrief,
  ExpandedLearnerProfile,
  KnowledgeBubble,
  CurriculumRecommendation,
  PragmaticState,
  ContextLogEntry,
  FrontierData,
  TomBrief,
  NarrativeDraft,
} from '@shared/types'

interface LinguistApi {
  // Reviews
  reviewGetQueue: () => Promise<ReviewQueueItem[]>
  reviewSubmit: (submission: ReviewSubmission) => Promise<{ newMasteryState: string }>
  reviewGetSummary: () => Promise<ReviewSummary>

  // Word Bank
  wordbankList: (filters?: WordBankFilters) => Promise<WordBankEntry[]>
  wordbankGet: (id: number) => Promise<WordBankEntry | null>
  wordbankAdd: (data: {
    surfaceForm: string
    reading?: string
    meaning: string
    partOfSpeech?: string
    tags?: string[]
  }) => Promise<WordBankEntry>
  wordbankUpdate: (
    id: number,
    data: { meaning?: string; tags?: string[]; masteryState?: string }
  ) => Promise<WordBankEntry>
  wordbankSearch: (query: string) => Promise<WordBankEntry[]>

  // Conversation
  conversationPlan: () => Promise<SessionPlan>
  conversationSend: (sessionId: string, message: string) => Promise<ConversationMessage>
  conversationEnd: (sessionId: string) => Promise<void>
  conversationList: () => Promise<
    Array<{ id: string; timestamp: string; durationSeconds: number | null; sessionFocus: string }>
  >

  // ToM
  tomRunAnalysis: () => Promise<void>
  tomGetBrief: () => Promise<TomBrief>
  tomGetInferences: () => Promise<
    Array<{
      id: number
      type: string
      itemIds: number[]
      confidence: number
      description: string
      resolved: boolean
    }>
  >

  // Profile
  profileGet: () => Promise<ExpandedLearnerProfile>
  profileUpdate: (data: {
    dailyNewItemLimit?: number
    targetRetention?: number
  }) => Promise<ExpandedLearnerProfile>
  profileRecalculate: () => Promise<ExpandedLearnerProfile>

  // Curriculum
  curriculumGetBubble: () => Promise<KnowledgeBubble>
  curriculumGetRecommendations: (limit?: number) => Promise<CurriculumRecommendation[]>
  curriculumIntroduceItem: (data: {
    itemType: string
    surfaceForm?: string
    patternId?: string
  }) => Promise<void>
  curriculumSkipItem: (data: {
    itemType: string
    surfaceForm?: string
    patternId?: string
  }) => Promise<void>
  curriculumRegenerate: () => Promise<CurriculumRecommendation[]>

  // Pragmatics
  pragmaticGetState: () => Promise<PragmaticState>
  pragmaticUpdate: (data: Partial<PragmaticState>) => Promise<PragmaticState>

  // Context Log
  contextLogList: (filters?: {
    itemId?: number
    itemType?: string
    contextType?: string
    limit?: number
  }) => Promise<ContextLogEntry[]>
  contextLogAdd: (entry: {
    contextType: string
    modality: string
    wasProduction: boolean
    wasSuccessful?: boolean
    contextQuote?: string
    sessionId?: string
    lexicalItemId?: number
    grammarItemId?: number
  }) => Promise<ContextLogEntry>

  // Dashboard
  dashboardGetFrontier: () => Promise<FrontierData | null>

  // Narrative
  narrativeBuildDraft: (frontier: FrontierData, brief: TomBrief | null) => Promise<NarrativeDraft>
  narrativePolish: (draft: NarrativeDraft) => Promise<string>
}

declare global {
  interface Window {
    linguist: LinguistApi
    platform: 'darwin' | 'win32' | 'linux'
  }
}

export {}
