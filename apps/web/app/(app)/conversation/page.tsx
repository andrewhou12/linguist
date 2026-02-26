'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Flex, Text, Badge, Button, IconButton } from '@radix-ui/themes'
import { ArrowUp, Square } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type {
  ExpandedSessionPlan,
  ConversationMessage,
  PostSessionAnalysis,
} from '@linguist/shared/types'
import { api } from '@/lib/api'
import { parseMessage, extractTargetsHit, type MessageSegment } from '@/lib/message-parser'
import { VocabCard, GrammarCard, CorrectionCard, ReviewPromptCard } from '@/components/conversation-cards'
import { ChallengeCard } from '@/components/challenge-card'
import { SessionSummaryCard } from '@/components/session-summary'
import { Spinner } from '@/components/spinner'

type Phase = 'planning' | 'conversation' | 'summary'

export default function ConversationPage() {
  const [phase, setPhase] = useState<Phase>('planning')
  const [sessionPlan, setSessionPlan] = useState<ExpandedSessionPlan | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [analysis, setAnalysis] = useState<PostSessionAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [targetsHit, setTargetsHit] = useState<Set<string>>(new Set())
  const sessionStartTime = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Planning phase: start session
  const handleStartSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const plan = await api.conversationPlan()
      setSessionPlan(plan)
      setSessionId(plan._sessionId ?? null)
      setMessages([])
      setTargetsHit(new Set())
      sessionStartTime.current = Date.now()
      setPhase('conversation')
    } catch (err) {
      console.error('Failed to plan session:', err)
      setError(err instanceof Error ? err.message : 'Failed to start session. Please try again.')
    }
    setIsLoading(false)
  }, [])

  // Send message with streaming
  const handleSend = useCallback(async () => {
    if (!input.trim() || !sessionId || isSending) return
    const text = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: ConversationMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsSending(true)
    setStreamingContent('')

    try {
      await api.conversationSendStream(
        sessionId,
        text,
        (delta) => {
          setStreamingContent((prev) => prev + delta)
        },
        (message) => {
          setMessages((prev) => [...prev, message])
          setStreamingContent('')
          // Parse targets hit from assistant response
          const hits = extractTargetsHit(message.content)
          if (hits.length > 0) {
            setTargetsHit((prev) => {
              const next = new Set(prev)
              for (const h of hits) next.add(h)
              return next
            })
          }
        },
        (error) => {
          console.error('Stream error:', error)
        }
      )
    } catch (err) {
      console.error('Failed to send message:', err)
    }
    setIsSending(false)
  }, [input, sessionId, isSending])

  // End session
  const handleEndSession = useCallback(async () => {
    if (!sessionId) return
    setIsLoading(true)
    try {
      const result = await api.conversationEnd(sessionId)
      setAnalysis(result)
      setPhase('summary')
    } catch (err) {
      console.error('Failed to end session:', err)
    }
    setIsLoading(false)
  }, [sessionId])

  // New session
  const handleNewSession = useCallback(() => {
    setPhase('planning')
    setSessionPlan(null)
    setSessionId(null)
    setMessages([])
    setAnalysis(null)
    setTargetsHit(new Set())
    setStreamingContent('')
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [])

  // ── Planning Phase ──
  if (phase === 'planning') {
    return (
      <Box style={{ maxWidth: 640, margin: '0 auto' }}>
        <Text size="7" weight="bold" style={{ display: 'block', marginBottom: 24 }}>
          Conversation
        </Text>
        <Text size="3" color="gray" style={{ display: 'block', marginBottom: 24 }}>
          Start a conversation session. The AI will plan targets based on your knowledge state.
        </Text>
        {error && (
          <Box mb="3" p="3" style={{ backgroundColor: 'var(--red-3)', borderRadius: 'var(--radius-2)' }}>
            <Text size="2" color="red">{error}</Text>
          </Box>
        )}
        <Button size="3" onClick={handleStartSession} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size={16} />
              Planning session...
            </>
          ) : (
            'Start Session'
          )}
        </Button>
      </Box>
    )
  }

  // ── Summary Phase ──
  if (phase === 'summary' && sessionPlan) {
    const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000)
    const totalTargets = (sessionPlan.targetVocabulary?.length ?? 0) + (sessionPlan.targetGrammar?.length ?? 0)
    return (
      <Box style={{ maxWidth: 640, margin: '0 auto' }}>
        <Text size="7" weight="bold" style={{ display: 'block', marginBottom: 16 }}>
          Session Complete
        </Text>
        {analysis && (
          <SessionSummaryCard
            analysis={analysis}
            durationSeconds={durationSeconds}
            totalTargets={totalTargets}
          />
        )}
        <Flex gap="3" mt="4">
          <Button onClick={handleNewSession}>Start New Session</Button>
        </Flex>
      </Box>
    )
  }

  // ── Conversation Phase ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Session info bar */}
      <Flex
        align="center"
        justify="between"
        px="4"
        py="2"
        style={{ borderBottom: '1px solid var(--gray-5)', flexShrink: 0 }}
      >
        <Flex align="center" gap="3">
          <Text size="2" weight="medium">
            {sessionPlan?.sessionFocus ?? 'Conversation'}
          </Text>
          {sessionPlan && (
            <>
              <Badge size="1" variant="soft">{sessionPlan.difficultyLevel}</Badge>
              <Badge size="1" variant="outline" color="gray">{sessionPlan.register}</Badge>
            </>
          )}
        </Flex>
        <Button variant="soft" color="red" size="2" onClick={handleEndSession} disabled={isLoading}>
          <Square size={12} />
          End Session
        </Button>
      </Flex>

      {/* Challenge card */}
      {sessionPlan && (
        <div style={{ padding: '0 24px' }}>
          <div style={{ maxWidth: 768, margin: '0 auto' }}>
            <ChallengeCard plan={sessionPlan} targetsHit={targetsHit} />
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '16px 24px' }}>
          {messages.map((msg, i) => (
            <MessageSegmentRenderer key={i} message={msg} />
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div style={{ padding: '12px 0' }}>
              <div className="chat-markdown" style={{ color: 'var(--gray-12)', lineHeight: 1.7, fontSize: 15 }}>
                <Markdown remarkPlugins={[remarkGfm]}>{streamingContent}</Markdown>
                <span className="blink-cursor" />
              </div>
            </div>
          )}

          {/* Thinking indicator */}
          {isSending && !streamingContent && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <Flex align="center" gap="2" py="3">
              <Spinner size={16} />
              <Text size="2" color="gray">Thinking...</Text>
            </Flex>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 24px' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'end',
              gap: 8,
              border: '1px solid var(--gray-6)',
              borderRadius: 24,
              padding: '8px 8px 8px 20px',
              backgroundColor: 'var(--gray-2)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                adjustTextarea()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: 'none',
                background: 'transparent',
                color: 'var(--gray-12)',
                fontSize: 15,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                outline: 'none',
                padding: '4px 0',
                maxHeight: 200,
              }}
            />
            <IconButton
              size="2"
              variant="solid"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              style={{ borderRadius: '50%', flexShrink: 0 }}
            >
              <ArrowUp size={16} />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Message rendering with structured cards ──

function MessageSegmentRenderer({ message }: { message: ConversationMessage }) {
  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0' }}>
        <div
          style={{
            maxWidth: '75%',
            padding: '10px 16px',
            borderRadius: 20,
            backgroundColor: 'var(--gray-3)',
            color: 'var(--gray-12)',
            lineHeight: 1.6,
            fontSize: 15,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  const segments = parseMessage(message.content)

  return (
    <div style={{ padding: '12px 0' }}>
      {segments.map((segment, i) => (
        <SegmentComponent key={i} segment={segment} />
      ))}
    </div>
  )
}

function SegmentComponent({ segment }: { segment: MessageSegment }) {
  switch (segment.type) {
    case 'vocab_card':
      return <VocabCard segment={segment} />
    case 'grammar_card':
      return <GrammarCard segment={segment} />
    case 'correction':
      return <CorrectionCard segment={segment} />
    case 'review_prompt':
      return <ReviewPromptCard segment={segment} />
    case 'targets_hit':
      return null // Metadata only, not rendered
    case 'text':
    default:
      if (!segment.content.trim()) return null
      return (
        <div className="chat-markdown" style={{ color: 'var(--gray-12)', lineHeight: 1.7, fontSize: 15 }}>
          <Markdown remarkPlugins={[remarkGfm]}>{segment.content}</Markdown>
        </div>
      )
  }
}
