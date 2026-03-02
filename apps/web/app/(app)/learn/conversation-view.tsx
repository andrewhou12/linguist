'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import type { ConversationMessage, ExpandedSessionPlan } from '@lingle/shared/types'
import { Spinner } from '@/components/spinner'
import { MessageBubble } from '@/components/message-bubble'
import { useRomaji, useAnnotatedTexts } from '@/hooks/use-romaji'
import { processRubyText } from '@/lib/ruby-annotator'
import { cn } from '@/lib/utils'

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
  const { showRomaji, toggle: toggleRomaji } = useRomaji()
  const assistantTexts = useMemo(
    () => messages.filter((m) => m.role === 'assistant').map((m) => m.content),
    [messages]
  )
  const { getAnnotated } = useAnnotatedTexts(assistantTexts, showRomaji)

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
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="h-full flex flex-col">
      {/* Session info bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium">
            {plan.sessionFocus}
          </span>
          <span className="inline-flex items-center py-0.5 px-2 rounded-full bg-bg-secondary text-[11px] font-medium text-text-secondary">
            {plan.difficultyLevel}
          </span>
          <span className="inline-flex items-center py-0.5 px-2 rounded-full border border-border text-[11px] text-text-muted">
            {plan.register}
          </span>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(200,87,42,.06)] py-1.5 px-3 text-[13px] font-medium text-accent-warm border-none cursor-pointer transition-colors duration-150 hover:bg-[rgba(200,87,42,.12)]"
          onClick={onEnd}
        >
          <Square size={12} />
          End Session
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-4">
          {messages.map((msg, i) => {
            const content = msg.role === 'assistant' && showRomaji ? getAnnotated(msg.content) : msg.content
            return <MessageBubble key={i} message={{ ...msg, content }} showRomaji={showRomaji} />
          })}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-center gap-2 py-3">
              <Spinner size={16} />
              <span className="text-[13px] text-text-muted">
                Thinking...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="px-6 pt-3 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2 border border-border rounded-3xl py-2 pr-2 pl-5 bg-bg-secondary">
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
                className="flex-1 resize-none border-none bg-transparent text-text-primary text-[15px] leading-normal font-[inherit] outline-none py-1 max-h-[200px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-accent-brand text-white border-none cursor-pointer transition-opacity duration-150",
                  (!input.trim() || isLoading) && "opacity-40"
                )}
              >
                <ArrowUp size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between px-1">
              <button
                className={cn(
                  'h-7 rounded-full border px-2.5 flex items-center gap-1 text-[11px] font-medium transition-colors',
                  showRomaji
                    ? 'border-accent-brand/30 bg-accent-brand/10 text-accent-brand'
                    : 'border-border bg-bg-pure text-text-muted hover:bg-bg-hover'
                )}
                onClick={toggleRomaji}
                title={showRomaji ? 'Hide romaji' : 'Show romaji above all text'}
              >
                <span className="text-[12px] font-jp font-bold leading-none">あ</span>
                <span>→ a</span>
              </button>
              <span className="text-[11px] text-text-placeholder select-none">
                ⏎ send · ⇧⏎ newline
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
