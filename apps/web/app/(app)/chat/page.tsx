'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Flex, Text, Button, Popover, IconButton, ScrollArea } from '@radix-ui/themes'
import { Plus, ChevronDown, Trash2, ArrowUp, Square } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { MessageBubble } from '@/components/message-bubble'

function getMessageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('')
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Array<{ id: string; title: string }>>(() => [
    { id: crypto.randomUUID(), title: 'New Chat' },
  ])
  const [activeId, setActiveId] = useState<string | null>(() => conversations[0]?.id ?? null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, stop, status, setMessages } = useChat({
    id: activeId ?? undefined,
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  // Auto-title conversation after first user message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'user') {
      const content = getMessageText(messages[0])
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, title: content.slice(0, 40) + (content.length > 40 ? '...' : '') }
            : c
        )
      )
    }
  }, [messages, activeId])

  const createConversation = useCallback(() => {
    const current = conversations.find((c) => c.id === activeId)
    if (current && messages.length === 0) {
      setDropdownOpen(false)
      return
    }
    const id = crypto.randomUUID()
    setConversations((prev) => [{ id, title: 'New Chat' }, ...prev])
    setActiveId(id)
    setMessages([])
    setDropdownOpen(false)
  }, [conversations, activeId, messages.length, setMessages])

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) {
        setActiveId(null)
        setMessages([])
      }
    },
    [activeId, setMessages]
  )

  const switchConversation = useCallback((id: string) => {
    setActiveId(id)
    setMessages([])
    setDropdownOpen(false)
  }, [setMessages])

  // Auto-recover if active conversation is missing
  useEffect(() => {
    if (!activeConversation) {
      if (conversations.length > 0) {
        setActiveId(conversations[0].id)
      } else {
        const id = crypto.randomUUID()
        setConversations([{ id, title: 'New Chat' }])
        setActiveId(id)
      }
    }
  }, [activeConversation, conversations])

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
    sendMessage({ text })
  }, [input, isLoading, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const pastConversations = conversations.filter((c) => c.title !== 'New Chat' || (c.id === activeId && messages.length > 0))

  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isEmpty = messages.length === 0 && !isLoading

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
      {isLoading ? (
        <IconButton
          type="button"
          size="2"
          variant="soft"
          color="red"
          onClick={() => stop()}
          style={{ borderRadius: '50%', flexShrink: 0 }}
        >
          <Square size={14} />
        </IconButton>
      ) : (
        <IconButton
          type="button"
          size="2"
          variant="solid"
          disabled={!input.trim()}
          onClick={handleSend}
          style={{ borderRadius: '50%', flexShrink: 0 }}
        >
          <ArrowUp size={16} />
        </IconButton>
      )}
    </div>
  )

  return (
    <Flex direction="column" style={{ height: '100%' }}>
      {/* Header */}
      <Flex
        align="center"
        justify="between"
        px="3"
        py="2"
        style={{ borderBottom: '1px solid var(--gray-5)', flexShrink: 0 }}
      >
        <Popover.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <Popover.Trigger>
            <Button variant="ghost" size="2">
              <Text size="2" weight="medium">
                {activeConversation && messages.length > 0
                  ? activeConversation.title
                  : 'Chat'}
              </Text>
              <ChevronDown size={14} />
            </Button>
          </Popover.Trigger>
          <Popover.Content style={{ maxHeight: 300, width: 280, padding: 8 }}>
            <ScrollArea>
              <Flex direction="column" gap="1">
                {pastConversations.length === 0 ? (
                  <Text size="2" color="gray" style={{ padding: '8px 4px' }}>
                    No conversations yet
                  </Text>
                ) : (
                  pastConversations.map((c) => (
                    <Flex
                      key={c.id}
                      align="center"
                      justify="between"
                      px="2"
                      py="1"
                      style={{
                        borderRadius: 'var(--radius-2)',
                        cursor: 'pointer',
                        backgroundColor: c.id === activeId ? 'var(--accent-3)' : 'transparent',
                      }}
                      onClick={() => switchConversation(c.id)}
                    >
                      <Text size="2" truncate style={{ flex: 1, marginRight: 8 }}>
                        {c.title}
                      </Text>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(c.id)
                        }}
                      >
                        <Trash2 size={12} />
                      </IconButton>
                    </Flex>
                  ))
                )}
              </Flex>
            </ScrollArea>
          </Popover.Content>
        </Popover.Root>

        <Button variant="soft" size="2" onClick={createConversation}>
          <Plus size={14} />
          New Chat
        </Button>
      </Flex>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {isEmpty ? (
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
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ maxWidth: 768, margin: '0 auto', padding: '16px 24px' }}>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={{ role: msg.role as 'user' | 'assistant', content: getMessageText(msg) }}
                    isStreaming={isLoading && msg.role === 'assistant' && msg === messages[messages.length - 1]}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div style={{ padding: '12px 24px 24px' }}>
              <div style={{ maxWidth: 768, margin: '0 auto' }}>{inputArea}</div>
            </div>
          </div>
        )}
      </div>
    </Flex>
  )
}
