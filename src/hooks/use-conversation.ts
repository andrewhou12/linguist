import { useState, useCallback } from 'react'
import type { ConversationMessage, SessionPlan } from '@shared/types'

export function useConversation() {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const startSession = useCallback(async () => {
    setIsLoading(true)
    const sessionPlan = await window.linguist.conversationPlan()
    setPlan(sessionPlan)
    setSessionId(crypto.randomUUID())
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
      const response = await window.linguist.conversationSend(sessionId, content)
      setMessages((prev) => [...prev, response])
      setIsLoading(false)

      return response
    },
    [sessionId]
  )

  const endSession = useCallback(async () => {
    if (!sessionId) return
    await window.linguist.conversationEnd(sessionId)
    setSessionId(null)
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
