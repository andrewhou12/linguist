import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  KnowledgeBubble,
  CurriculumRecommendation,
  ExpandedSessionPlan,
  ConversationMessage,
  PostSessionAnalysis,
} from '@shared/types'
import { SessionPreview } from './session-preview'
import { ConversationView } from './conversation-view'
import { SessionSummary } from './session-summary'

type LearnPhase = 'planning' | 'conversation' | 'summary'

export function LearnPage() {
  const [phase, setPhase] = useState<LearnPhase>('planning')
  const [bubble, setBubble] = useState<KnowledgeBubble | null>(null)
  const [recommendations, setRecommendations] = useState<CurriculumRecommendation[]>([])
  const [sessionPlan, setSessionPlan] = useState<ExpandedSessionPlan | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [analysis, setAnalysis] = useState<PostSessionAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const sessionStartTime = useRef<number>(0)

  const fetchPlanningData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [bubbleData, recs] = await Promise.all([
        window.linguist.curriculumGetBubble(),
        window.linguist.curriculumGetRecommendations(),
      ])
      setBubble(bubbleData)
      setRecommendations(recs)
    } catch (err) {
      console.error('Failed to fetch planning data:', err)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchPlanningData()
  }, [fetchPlanningData])

  const handleSkip = useCallback(async (id: number) => {
    try {
      await window.linguist.curriculumSkipItem(id)
    } catch (err) {
      console.error('Failed to skip item:', err)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const recs = await window.linguist.curriculumRegenerate()
      setRecommendations(recs)
    } catch (err) {
      console.error('Failed to regenerate:', err)
    }
    setIsLoading(false)
  }, [])

  const handleStart = useCallback(async () => {
    setIsLoading(true)
    try {
      // Introduce non-skipped items
      const toIntroduce = recommendations.filter((r) => r.id != null)
      for (const rec of toIntroduce) {
        try {
          await window.linguist.curriculumIntroduceItem(rec.id!)
        } catch {
          // Item may already exist — continue
        }
      }

      // Create session plan
      const plan = await window.linguist.conversationPlan()
      setSessionPlan(plan)
      setSessionId(plan._sessionId ?? null)
      setMessages([])
      sessionStartTime.current = Date.now()
      setPhase('conversation')
    } catch (err) {
      console.error('Failed to start session:', err)
    }
    setIsLoading(false)
  }, [recommendations])

  const handleSend = useCallback(
    async (content: string) => {
      if (!sessionId) return
      const userMsg: ConversationMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsSending(true)
      try {
        const response = await window.linguist.conversationSend(sessionId, content)
        setMessages((prev) => [...prev, response])
      } catch (err) {
        console.error('Failed to send message:', err)
      }
      setIsSending(false)
    },
    [sessionId]
  )

  const handleEnd = useCallback(async () => {
    if (!sessionId) return
    setIsLoading(true)
    try {
      const result = await window.linguist.conversationEnd(sessionId)
      setAnalysis(result)
    } catch (err) {
      console.error('Failed to end session:', err)
    }
    setIsLoading(false)
    setPhase('summary')
  }, [sessionId])

  const handleNewSession = useCallback(() => {
    setPhase('planning')
    setSessionPlan(null)
    setSessionId(null)
    setMessages([])
    setAnalysis(null)
    fetchPlanningData()
  }, [fetchPlanningData])

  const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000)

  if (phase === 'conversation' && sessionPlan) {
    return (
      <ConversationView
        plan={sessionPlan}
        messages={messages}
        isLoading={isSending}
        onSend={handleSend}
        onEnd={handleEnd}
      />
    )
  }

  if (phase === 'summary' && sessionPlan) {
    return (
      <SessionSummary
        plan={sessionPlan}
        analysis={analysis}
        durationSeconds={durationSeconds}
        onNewSession={handleNewSession}
      />
    )
  }

  return (
    <SessionPreview
      bubble={bubble}
      recommendations={recommendations}
      isLoading={isLoading}
      onSkip={handleSkip}
      onRefresh={handleRefresh}
      onStart={handleStart}
    />
  )
}
