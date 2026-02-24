import { useState, useEffect, useRef, useCallback } from 'react'
import { Flex, Text, Badge, Button, IconButton } from '@radix-ui/themes'
import { ArrowUp, Square } from 'lucide-react'
import type { ConversationMessage, ExpandedSessionPlan } from '@shared/types'
import { Spinner } from '../../components/spinner'
import { MessageBubble } from '../chat/message-bubble'

interface ConversationViewProps {
  plan: ExpandedSessionPlan
  messages: ConversationMessage[]
  isLoading: boolean
  onSend: (content: string) => void
  onEnd: () => void
}

export function ConversationView({
  plan,
  messages,
  isLoading,
  onSend,
  onEnd,
}: ConversationViewProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [])

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(text)
  }, [input, isLoading, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

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
            {plan.sessionFocus}
          </Text>
          <Badge size="1" variant="soft">
            {plan.difficultyLevel}
          </Badge>
          <Badge size="1" variant="outline" color="gray">
            {plan.register}
          </Badge>
        </Flex>
        <Button variant="soft" color="red" size="2" onClick={onEnd}>
          <Square size={12} />
          End Session
        </Button>
      </Flex>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '16px 24px' }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <Flex align="center" gap="2" py="3">
              <Spinner size={16} />
              <Text size="2" color="gray">
                Thinking...
              </Text>
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
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
              disabled={!input.trim() || isLoading}
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
