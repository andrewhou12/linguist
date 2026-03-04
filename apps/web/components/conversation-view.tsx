'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Square } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { api } from '@/lib/api'
import { stripRubyAnnotations } from '@/lib/ruby-annotator'
import { useRomaji, useAnnotatedTexts } from '@/hooks/use-romaji'
import { useTTS } from '@/hooks/use-tts'
import { RomajiText } from '@/components/romaji-text'
import { MessageBlock } from '@/components/chat/message-block'
import { ChatInput } from '@/components/chat/chat-input'
import { EscapeHatch } from '@/components/chat/escape-hatch'
import { SuggestionChips } from '@/components/chat/suggestion-chips'
import { Spinner } from '@/components/spinner'
import { cn } from '@/lib/utils'

interface TopicStarter {
  emoji: string
  label: string
  description: string
  firstMessage: string
  hint: string
}

const TOPIC_STARTERS: TopicStarter[] = [
  {
    emoji: '\u2615',
    label: 'Cafe',
    description: 'Ordering drinks & food',
    firstMessage: '\u30B3\u30FC\u30D2\u30FC\u3092\u4E00\u3064\u304F\u3060\u3055\u3044\u3002',
    hint: 'Ordering at a cafe — food vocabulary, polite request forms, counters',
  },
  {
    emoji: '\uD83D\uDDD3\uFE0F',
    label: 'Plans',
    description: 'Weekend & future plans',
    firstMessage: '\u9031\u672B\u306F\u4F55\u3092\u3057\u307E\u3059\u304B\uFF1F',
    hint: 'Discussing weekend plans — volitional form, time expressions, activities',
  },
  {
    emoji: '\uD83C\uDFD9\uFE0F',
    label: 'City',
    description: 'Exploring & directions',
    firstMessage: '\u3053\u306E\u8FBA\u306B\u304A\u3059\u3059\u3081\u306E\u5834\u6240\u306F\u3042\u308A\u307E\u3059\u304B\uFF1F',
    hint: 'Exploring a city — location words, directions, recommendations',
  },
  {
    emoji: '\uD83C\uDF8C',
    label: 'Free',
    description: 'Open conversation',
    firstMessage: '\u4ECA\u65E5\u306F\u4F55\u3092\u8A71\u3057\u307E\u3057\u3087\u3046\u304B\uFF1F',
    hint: '',
  },
]

function getGreeting(): { japanese: string; english: string } {
  const hour = new Date().getHours()
  let japanese: string
  if (hour < 11) {
    japanese = '\u304A\u306F\u3088\u3046\uFF01'
  } else if (hour < 17) {
    japanese = '\u3053\u3093\u306B\u3061\u306F\uFF01'
  } else {
    japanese = '\u3053\u3093\u3070\u3093\u306F\uFF01'
  }
  return { japanese, english: 'What would you like to practice today?' }
}

const DEFAULT_SUGGESTIONS = [
  'こんにちは！',
  'What should we talk about?',
  'もう一度お願いします',
]

type Phase = 'idle' | 'conversation'

export function ConversationView() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string | null>(null)
  sessionIdRef.current = sessionId
  const { showRomaji, toggle: toggleRomaji } = useRomaji()
  const tts = useTTS()

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/conversation/send',
        body: () => (sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}),
      }),
    []
  )

  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({ transport })

  const isSending = status === 'streaming' || status === 'submitted'

  // Extract text from assistant messages for romaji annotation
  const assistantTexts = useMemo(
    () =>
      messages
        .filter((m) => m.role === 'assistant')
        .map((m) => {
          const textParts = m.parts.filter((p) => p.type === 'text')
          return textParts.map((p) => (p as { type: 'text'; text: string }).text).join('')
        }),
    [messages]
  )
  const { getAnnotated } = useAnnotatedTexts(assistantTexts, showRomaji)

  // Extract dynamic suggestions from the latest assistant message
  const dynamicSuggestions = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts) {
        const partType = (part as { type: string }).type
        if (partType === 'tool-suggestResponses') {
          const toolPart = part as { type: string; state: string; output?: unknown }
          if (toolPart.state === 'output-available' && toolPart.output) {
            const output = toolPart.output as { suggestions: string[] }
            if (output.suggestions?.length > 0) return output.suggestions
          }
        }
      }
      break // Only check the latest assistant message
    }
    return null
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartSessionWithMessage = useCallback(async (initialMessage?: string, topicHint?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const plan = await api.conversationPlan(topicHint || undefined)
      setSessionId(plan._sessionId ?? null)
      setMessages([])
      setPhase('conversation')
      if (initialMessage) {
        requestAnimationFrame(() => {
          sendMessage({ text: initialMessage })
        })
      }
    } catch (err) {
      console.error('Failed to start session:', err)
      setError(err instanceof Error ? err.message : 'Failed to start session. Please try again.')
    }
    setIsLoading(false)
  }, [setMessages, sendMessage])

  const handlePlanningSubmit = useCallback(async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    await handleStartSessionWithMessage(text, text)
  }, [input, handleStartSessionWithMessage])

  const handleTopicSelect = useCallback(async (topic: TopicStarter) => {
    await handleStartSessionWithMessage(topic.firstMessage, topic.hint || undefined)
  }, [handleStartSessionWithMessage])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !sessionId || isSending) return
    const text = input.trim()
    setInput('')
    await sendMessage({ text })
  }, [input, sessionId, isSending, sendMessage])

  const handleSuggestionSelect = useCallback((text: string) => {
    setInput(text)
  }, [])

  const handleEscapeHatch = useCallback(() => {
    setInput("I'd like to switch to English for a moment: ")
  }, [])

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return
    setIsLoading(true)
    try {
      await api.conversationEnd(sessionId)
    } catch (err) {
      console.error('Failed to end session:', err)
    }
    setIsLoading(false)
    setPhase('idle')
    setSessionId(null)
    setMessages([])
  }, [sessionId, setMessages])

  // Idle Phase — topic selection
  if (phase === 'idle') {
    const greeting = getGreeting()

    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <div className="max-w-[640px] w-full flex flex-col items-center text-center">
          {/* Logo */}
          <h1 className="logo-shimmer text-[42px] italic font-serif font-semibold mb-6 select-none">
            Lingle
          </h1>

          {/* Japanese greeting */}
          <p className="text-[28px] font-jp font-medium text-text-primary mb-1.5">
            {greeting.japanese}
          </p>

          {/* English line */}
          <p className="text-[15px] text-text-secondary mb-6">
            {greeting.english}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-warm-soft rounded-lg w-full">
              <span className="text-[13px] text-accent-warm">{error}</span>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading ? (
            <div className="flex items-center gap-2.5 py-3 mb-6">
              <Spinner size={16} />
              <span className="text-[14px] text-text-muted">Starting session...</span>
            </div>
          ) : (
            <>
              {/* Chat input */}
              <div className="w-full mb-8">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={handlePlanningSubmit}
                  disabled={isLoading}
                  placeholder="Type a topic or message to start..."
                  showRomaji={showRomaji}
                  onToggleRomaji={toggleRomaji}
                  minRows={3}
                />
              </div>

              {/* Topic starters */}
              <p className="text-[11px] uppercase tracking-wider text-text-muted mb-3 font-medium">
                Or start with a topic
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                {TOPIC_STARTERS.map((topic) => (
                  <button
                    key={topic.label}
                    className="flex items-start gap-3 p-4 rounded-xl bg-bg-pure border border-border-subtle text-left cursor-pointer transition-all hover:border-border-strong hover:shadow-[var(--shadow-sm)] active:scale-[0.98]"
                    onClick={() => handleTopicSelect(topic)}
                  >
                    <span className="text-[20px] mt-0.5 shrink-0">{topic.emoji}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-medium text-text-primary">{topic.label}</span>
                      <span className="text-[12px] text-text-muted leading-snug">{topic.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Conversation Phase
  return (
    <div className="h-full flex flex-col -m-6">
      {/* Session info sticky bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-border shrink-0 bg-bg">
        <span className="text-[13px] font-medium text-text-primary">Conversation</span>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg bg-warm-soft px-3 py-1.5 text-[13px] font-medium text-accent-warm border-none cursor-pointer transition-colors hover:bg-warm-med',
            isLoading && 'opacity-50'
          )}
          onClick={handleEndSession}
          disabled={isLoading}
        >
          <Square size={12} />
          End Session
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-4">
          {messages.map((msg) => (
            <UIMessageRenderer
              key={msg.id}
              message={msg}
              showRomaji={showRomaji}
              getAnnotated={getAnnotated}
              onPlay={
                msg.role === 'assistant' && msg.parts.some((p) => p.type === 'text' && (p as { type: 'text'; text: string }).text.trim())
                  ? () => {
                      const textContent = msg.parts
                        .filter((p) => p.type === 'text')
                        .map((p) => (p as { type: 'text'; text: string }).text)
                        .join('')
                      tts.play(msg.id, textContent)
                    }
                  : undefined
              }
              onStop={msg.role === 'assistant' && msg.parts.some((p) => p.type === 'text' && (p as { type: 'text'; text: string }).text.trim()) ? tts.stop : undefined}
              isPlayingAudio={tts.playingId === msg.id}
              isStreaming={isSending && msg === messages[messages.length - 1] && msg.role === 'assistant'}
            />
          ))}

          {/* Loading indicator */}
          {isSending && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-center gap-2.5 py-3 pl-10">
              <Spinner size={14} />
              <span className="text-[13px] text-text-muted">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom area: escape hatch + chips + input */}
      <div className="px-6 pt-2 pb-4 flex flex-col gap-3">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
          {/* Escape hatch */}
          {messages.length > 0 && !isSending && (
            <EscapeHatch onUse={handleEscapeHatch} />
          )}

          {/* Suggestion chips */}
          {(messages.length === 0 || (messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isSending)) && (
            <SuggestionChips
              suggestions={dynamicSuggestions ?? DEFAULT_SUGGESTIONS}
              onSelect={handleSuggestionSelect}
            />
          )}

          {/* Chat input */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isSending}
            placeholder="Type your message..."
            showRomaji={showRomaji}
            onToggleRomaji={toggleRomaji}
          />
        </div>
      </div>
    </div>
  )
}

// Parts-based message rendering

function UIMessageRenderer({
  message,
  showRomaji,
  getAnnotated,
  onPlay,
  onStop,
  isPlayingAudio,
  isStreaming,
}: {
  message: UIMessage
  showRomaji: boolean
  getAnnotated: (text: string) => string
  onPlay?: () => void
  onStop?: () => void
  isPlayingAudio?: boolean
  isStreaming?: boolean
}) {
  if (message.role === 'user') {
    const textContent = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('')
    return (
      <MessageBlock
        role="user"
        content={textContent}
      />
    )
  }

  // Assistant message — render parts
  return (
    <MessageBlock
      role="assistant"
      content=""
      showRomaji={showRomaji}
      onPlay={onPlay}
      onStop={onStop}
      isPlayingAudio={isPlayingAudio}
      isStreaming={isStreaming}
    >
      {message.parts.map((part, i) => {
        const isLastTextPart = isStreaming && part.type === 'text' &&
          !message.parts.slice(i + 1).some((p) => p.type === 'text')
        return (
          <PartRenderer
            key={i}
            part={part}
            showRomaji={showRomaji}
            getAnnotated={getAnnotated}
            isStreaming={isLastTextPart || false}
          />
        )
      })}
    </MessageBlock>
  )
}

function PartRenderer({
  part,
  showRomaji,
  getAnnotated,
  isStreaming,
}: {
  part: UIMessage['parts'][number]
  showRomaji: boolean
  getAnnotated: (text: string) => string
  isStreaming?: boolean
}) {
  if (part.type === 'text') {
    const text = (part as { type: 'text'; text: string }).text
    if (!text.trim()) return null

    const displayText = showRomaji ? getAnnotated(text) : text
    if (showRomaji) {
      return (
        <RomajiText
          text={displayText}
          className="chat-markdown text-text-primary leading-[1.7] text-[14.5px]"
        />
      )
    }
    return (
      <div className={cn(
        "chat-markdown text-text-primary leading-[1.7] text-[14.5px]",
        isStreaming && "[&>p:last-of-type]:inline"
      )}>
        <Markdown remarkPlugins={[remarkGfm]}>
          {stripRubyAnnotations(displayText)}
        </Markdown>
        {isStreaming && <span className="blink-cursor" />}
      </div>
    )
  }

  // Tool invocations — hidden
  if ((part.type as string).startsWith('tool-')) {
    return null
  }

  return null
}
