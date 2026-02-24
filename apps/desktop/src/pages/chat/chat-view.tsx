import { useState, useEffect, useRef, useCallback } from 'react'
import { IconButton } from '@radix-ui/themes'
import { ArrowUp, Square } from 'lucide-react'
import type { ChatMessage } from '@shared/types'
import { MessageBubble } from './message-bubble'

interface ChatViewProps {
  conversationId: string
  messages: ChatMessage[]
  onUserMessage: (conversationId: string, content: string) => void
  onAssistantMessage: (conversationId: string, content: string) => void
}

export function ChatView({
  conversationId,
  messages,
  onUserMessage,
  onAssistantMessage,
}: ChatViewProps) {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const streamingRef = useRef('')
  const isStreamingRef = useRef(false)
  const conversationIdRef = useRef(conversationId)
  const onAssistantMessageRef = useRef(onAssistantMessage)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep refs in sync
  conversationIdRef.current = conversationId
  onAssistantMessageRef.current = onAssistantMessage

  // Set up IPC event listeners once
  useEffect(() => {
    const cleanupChunk = window.linguist.chatOnChunk((data) => {
      if (data.conversationId === conversationIdRef.current) {
        streamingRef.current += data.delta
        setStreamingContent(streamingRef.current)
      }
    })

    const cleanupDone = window.linguist.chatOnDone((data) => {
      if (data.conversationId === conversationIdRef.current) {
        if (streamingRef.current) {
          onAssistantMessageRef.current(
            conversationIdRef.current,
            streamingRef.current
          )
        }
        streamingRef.current = ''
        setStreamingContent('')
        setIsStreaming(false)
        isStreamingRef.current = false
      }
    })

    return () => {
      cleanupChunk()
      cleanupDone()
      if (isStreamingRef.current) {
        window.linguist.chatStop(conversationIdRef.current)
      }
    }
  }, [])

  // Reset streaming state when switching conversations
  useEffect(() => {
    streamingRef.current = ''
    setStreamingContent('')
    setIsStreaming(false)
    isStreamingRef.current = false
  }, [conversationId])

  // Auto-scroll to bottom on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [])

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return
    const text = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    onUserMessage(conversationId, text)

    setIsStreaming(true)
    isStreamingRef.current = true
    streamingRef.current = ''
    setStreamingContent('')

    const allMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text },
    ]
    window.linguist.chatSend(conversationId, allMessages).catch(() => {})
  }, [input, isStreaming, conversationId, messages, onUserMessage])

  const handleStop = useCallback(() => {
    window.linguist.chatStop(conversationId)
  }, [conversationId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const isEmpty = messages.length === 0 && !isStreaming

  const inputArea = (
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
        placeholder="Ask anything"
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
      {isStreaming ? (
        <IconButton
          size="2"
          variant="soft"
          color="red"
          onClick={handleStop}
          style={{ borderRadius: '50%', flexShrink: 0 }}
        >
          <Square size={14} />
        </IconButton>
      ) : (
        <IconButton
          size="2"
          variant="solid"
          onClick={handleSend}
          disabled={!input.trim()}
          style={{ borderRadius: '50%', flexShrink: 0 }}
        >
          <ArrowUp size={16} />
        </IconButton>
      )}
    </div>
  )

  if (isEmpty) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--gray-11)',
            margin: '0 0 32px',
          }}
        >
          What can I help with?
        </h2>
        <div style={{ width: '100%', maxWidth: 640 }}>{inputArea}</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '16px 24px' }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isStreaming && streamingContent && (
            <MessageBubble
              message={{ role: 'assistant', content: streamingContent }}
              isStreaming
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div style={{ padding: '12px 24px 24px' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>{inputArea}</div>
      </div>
    </div>
  )
}
