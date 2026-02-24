'use client'

import { useState, useCallback } from 'react'
import type { ConversationMessage, ExpandedSessionPlan, PostSessionAnalysis } from '@linguist/shared/types'
import { api } from '@/lib/api'

export function useConversation() {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [plan, setPlan] = useState<ExpandedSessionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const startSession = useCallback(async () => {
    setIsLoading(true)
    const sessionPlan = await api.conversationPlan()
    setPlan(sessionPlan)
    setSessionId(sessionPlan._sessionId ?? crypto.randomUUID())
    setMessages([])
    setIsLoading(false)
    return sessionPlan
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return

      const userMessage: ConversationMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      setIsLoading(true)
      const response = await api.conversationSend(sessionId, content)
      setMessages((prev) => [...prev, response])
      setIsLoading(false)

      return response
    },
    [sessionId]
  )

  const endSession = useCallback(async (): Promise<PostSessionAnalysis | null> => {
    if (!sessionId) return null
    const analysis = await api.conversationEnd(sessionId)
    setSessionId(null)
    return analysis
  }, [sessionId])

  return {
    messages,
    sessionId,
    plan,
    isLoading,
    startSession,
    sendMessage,
    endSession,
  }
}
