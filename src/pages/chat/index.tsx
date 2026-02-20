import { useState, useCallback, useEffect } from 'react'
import { Flex, Text, Button, Popover, IconButton, ScrollArea } from '@radix-ui/themes'
import { Plus, ChevronDown, Trash2 } from 'lucide-react'
import type { ChatMessage } from '@shared/types'
import { ChatView } from './chat-view'

interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
}

export function ChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => [
    { id: crypto.randomUUID(), title: 'New Chat', messages: [] },
  ])
  const [activeId, setActiveId] = useState<string | null>(() => conversations[0]?.id ?? null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null

  // Auto-recover if active conversation is missing
  useEffect(() => {
    if (!activeConversation) {
      if (conversations.length > 0) {
        setActiveId(conversations[0].id)
      } else {
        const id = crypto.randomUUID()
        setConversations([{ id, title: 'New Chat', messages: [] }])
        setActiveId(id)
      }
    }
  }, [activeConversation, conversations])

  const createConversation = useCallback(() => {
    // If current conversation is empty, just keep it
    const current = conversations.find((c) => c.id === activeId)
    if (current && current.messages.length === 0) {
      setDropdownOpen(false)
      return current.id
    }
    const id = crypto.randomUUID()
    setConversations((prev) => [
      { id, title: 'New Chat', messages: [] },
      ...prev,
    ])
    setActiveId(id)
    setDropdownOpen(false)
    return id
  }, [conversations, activeId])

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) setActiveId(null)
    },
    [activeId]
  )

  const switchConversation = useCallback((id: string) => {
    setActiveId(id)
    setDropdownOpen(false)
  }, [])

  const handleUserMessage = useCallback(
    (conversationId: string, content: string) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c
          const messages = [...c.messages, { role: 'user' as const, content }]
          const title =
            c.messages.length === 0
              ? content.slice(0, 40) + (content.length > 40 ? '...' : '')
              : c.title
          return { ...c, messages, title }
        })
      )
    },
    []
  )

  const handleAssistantMessage = useCallback(
    (conversationId: string, content: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: 'assistant' as const, content },
                ],
              }
            : c
        )
      )
    },
    []
  )

  const pastConversations = conversations.filter(
    (c) => c.messages.length > 0
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
                {activeConversation && activeConversation.messages.length > 0
                  ? activeConversation.title
                  : 'Chat'}
              </Text>
              <ChevronDown size={14} />
            </Button>
          </Popover.Trigger>
          <Popover.Content
            style={{ maxHeight: 300, width: 280, padding: 8 }}
          >
            <ScrollArea>
              <Flex direction="column" gap="1">
                {pastConversations.length === 0 ? (
                  <Text
                    size="2"
                    color="gray"
                    style={{ padding: '8px 4px' }}
                  >
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
                        backgroundColor:
                          c.id === activeId
                            ? 'var(--accent-3)'
                            : 'transparent',
                      }}
                      onClick={() => switchConversation(c.id)}
                    >
                      <Text
                        size="2"
                        truncate
                        style={{ flex: 1, marginRight: 8 }}
                      >
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
        {activeConversation && (
          <ChatView
            conversationId={activeConversation.id}
            messages={activeConversation.messages}
            onUserMessage={handleUserMessage}
            onAssistantMessage={handleAssistantMessage}
          />
        )}
      </div>
    </Flex>
  )
}
