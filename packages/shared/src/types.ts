export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface LearnerProfile {
  id: number
  targetLanguage: string
  nativeLanguage: string
  totalSessions: number
  lastActiveDate: string | null
}

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
  onboardingCompleted: boolean
}
