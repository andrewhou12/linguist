import type {
  ReviewSubmission,
  ReviewQueueItem,
  ReviewSummary,
  WordBankEntry,
  WordBankFilters,
  ConversationMessage,
  SessionPlan,
  TomBrief,
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
}

declare global {
  interface Window {
    linguist: LinguistApi
    platform: 'darwin' | 'win32' | 'linux'
  }
}

export {}
