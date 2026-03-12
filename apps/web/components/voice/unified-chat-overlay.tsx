'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { XMarkIcon, ArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { TurnAnalysisResult } from '@/lib/session-types'

interface ChatMessage {
  role: 'user' | 'ai' | 'system'
  text: string
}

// Feedback card embedded in chat
interface FeedbackCard {
  type: 'correction' | 'naturalness' | 'register' | 'culture'
  original?: string
  corrected?: string
  tip?: string
  explanation: string
  grammarPoint?: string
}

const FEEDBACK_COLORS: Record<FeedbackCard['type'], { border: string; bg: string; fg: string; label: string }> = {
  correction: { border: 'border-l-accent-warm', bg: 'bg-warm-soft', fg: 'text-accent-warm', label: 'Correction' },
  naturalness: { border: 'border-l-blue', bg: 'bg-blue-soft', fg: 'text-blue', label: 'More natural' },
  register: { border: 'border-l-purple', bg: 'bg-purple-soft', fg: 'text-purple', label: 'Register' },
  culture: { border: 'border-l-purple', bg: 'bg-purple-soft', fg: 'text-purple', label: 'Culture tip' },
}

interface UnifiedChatOverlayProps {
  isOpen: boolean
  onClose: () => void
  analysisResults: Record<number, TurnAnalysisResult>
  recentHistory: Array<{ role: string; content: string }>
  onRetry?: () => void
  onAddNote?: (text: string) => void
}

function extractFeedbackCards(results: Record<number, TurnAnalysisResult>): FeedbackCard[] {
  const cards: FeedbackCard[] = []
  const seen = new Set<string>()

  for (const result of Object.values(results)) {
    for (const c of result.corrections) {
      const key = `c::${c.original}::${c.corrected}`
      if (seen.has(key)) continue
      seen.add(key)
      cards.push({ type: 'correction', original: c.original, corrected: c.corrected, explanation: c.explanation, grammarPoint: c.grammarPoint })
    }
    for (const n of result.naturalnessFeedback) {
      const key = `n::${n.original}`
      if (seen.has(key)) continue
      seen.add(key)
      cards.push({ type: 'naturalness', original: n.original, corrected: n.suggestion, explanation: n.explanation })
    }
    for (const r of result.registerMismatches || []) {
      const key = `r::${r.original}`
      if (seen.has(key)) continue
      seen.add(key)
      cards.push({ type: 'register', original: r.original, corrected: r.suggestion, explanation: r.explanation })
    }
    for (const t of result.conversationalTips || []) {
      const key = `t::${t.tip.slice(0, 30)}`
      if (seen.has(key)) continue
      seen.add(key)
      cards.push({ type: 'culture', tip: t.tip, explanation: t.explanation })
    }
  }

  return cards
}

function FeedbackCardInline({ card, onRetry, onExamples }: { card: FeedbackCard; onRetry?: () => void; onExamples?: (topic: string) => void }) {
  const style = FEEDBACK_COLORS[card.type]

  return (
    <div className={cn('border-l-[3px] rounded-xl bg-bg-pure border border-border px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.04)]', style.border)}>
      <span className={cn('inline-flex text-[10.5px] font-medium rounded-full px-2 py-0.5 mb-2', style.bg, style.fg)}>
        {style.label}
      </span>
      {card.original && (
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-[14px] font-jp-clean text-text-muted line-through">{card.original}</span>
          <span className="text-text-muted text-[12px]">&rarr;</span>
          <span className="text-[14px] font-jp-clean font-medium text-text-primary">{card.corrected}</span>
        </div>
      )}
      {card.tip && (
        <div className="text-[14px] font-medium text-text-primary mb-1.5">{card.tip}</div>
      )}
      <p className="text-[13px] text-text-secondary leading-[1.5]">{card.explanation}</p>
      {card.grammarPoint && (
        <span className="inline-flex text-[10.5px] font-medium text-text-secondary bg-bg-secondary rounded-full px-2 py-0.5 mt-1.5 font-sans">
          {card.grammarPoint}
        </span>
      )}
      <div className="flex gap-2 mt-2.5">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-secondary border border-border text-[12px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <ArrowPathIcon className="w-3 h-3" />
            Retry
          </button>
        )}
        {onExamples && (
          <button
            onClick={() => onExamples(card.grammarPoint || card.corrected || card.tip || '')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-secondary border border-border text-[12px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            5 examples
          </button>
        )}
      </div>
    </div>
  )
}

export function UnifiedChatOverlay({
  isOpen,
  onClose,
  analysisResults,
  recentHistory,
  onRetry,
  onAddNote,
}: UnifiedChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const feedbackCards = extractFeedbackCards(analysisResults)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen, feedbackCards.length])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Hotkey: F to toggle (when not in text input)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
        e.preventDefault()
        if (isOpen) onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    const query = input.trim()
    setMessages(m => [...m, { role: 'user', text: query }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/conversation/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, recentHistory }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(m => [...m, { role: 'ai', text: data.suggestion }])
        // Add insight to session notes
        onAddNote?.(`Explored: ${query}`)
      } else {
        setMessages(m => [...m, { role: 'ai', text: 'Sorry, I couldn\'t get a suggestion right now.' }])
      }
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, recentHistory, onAddNote])

  const handleExamples = useCallback(async (topic: string) => {
    if (loading) return
    const query = `Give me 5 examples of ${topic}`
    setMessages(m => [...m, { role: 'user', text: query }])
    setLoading(true)

    try {
      const res = await fetch('/api/conversation/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, recentHistory }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(m => [...m, { role: 'ai', text: data.suggestion }])
        onAddNote?.(`Explored 5 examples of ${topic}`)
      } else {
        setMessages(m => [...m, { role: 'ai', text: 'Couldn\'t get examples right now.' }])
      }
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }, [loading, recentHistory, onAddNote])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/10 z-[200]"
            onClick={onClose}
          />

          {/* Overlay panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[201] top-[15vh] left-1/2 -translate-x-1/2 max-w-[520px] w-full max-h-[70vh] flex flex-col rounded-2xl bg-bg-pure border border-border shadow-[0_8px_40px_rgba(0,0,0,.12),0_4px_16px_rgba(0,0,0,.06)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
              <div>
                <div className="text-[15px] font-semibold text-text-primary tracking-[-0.02em]">Chat</div>
                <div className="text-[13px] text-text-muted mt-0.5">
                  Feedback, help, and follow-up questions
                </div>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="font-mono text-[10px] font-medium px-1 py-0.5 rounded bg-bg-secondary border border-border text-text-muted">F</kbd>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-text-muted cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  <XMarkIcon className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm"
            >
              {/* Feedback cards at top */}
              {feedbackCards.length > 0 && (
                <div className="flex flex-col gap-3">
                  {feedbackCards.map((card, i) => (
                    <FeedbackCardInline
                      key={i}
                      card={card}
                      onRetry={onRetry}
                      onExamples={handleExamples}
                    />
                  ))}
                </div>
              )}

              {feedbackCards.length > 0 && messages.length > 0 && (
                <div className="w-full h-px bg-border/60" />
              )}

              {/* Chat messages */}
              {messages.map((m, i) => (
                <div key={i}>
                  {m.role === 'user' ? (
                    <div className="bg-bg-secondary rounded-xl px-3.5 py-2.5 ml-12">
                      <p className="text-[14px] text-text-primary leading-[1.6]">{m.text}</p>
                    </div>
                  ) : m.role === 'system' ? (
                    <div className="text-[12px] text-text-muted italic text-center py-2">{m.text}</div>
                  ) : (
                    <div className="text-[14px] text-text-secondary leading-[1.7] prose-help">
                      <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted/50 animate-[voice-loading-dot_1.2s_ease-in-out_infinite]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted/50 animate-[voice-loading-dot_1.2s_ease-in-out_0.2s_infinite]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted/50 animate-[voice-loading-dot_1.2s_ease-in-out_0.4s_infinite]" />
                  </div>
                </div>
              )}

              {feedbackCards.length === 0 && messages.length === 0 && (
                <div className="text-center py-6 text-text-muted text-[14px]">
                  Ask a question or check your feedback here.
                </div>
              )}
            </div>

            {/* Input footer */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              <div className="relative bg-bg-pure border border-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,.04),0_1px_4px_rgba(0,0,0,.03)] transition-[border-color,box-shadow] duration-150 focus-within:border-border-strong focus-within:shadow-[0_2px_8px_rgba(0,0,0,.06),0_1px_4px_rgba(0,0,0,.04)]">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                      if (inputRef.current) inputRef.current.style.height = 'auto'
                    }
                  }}
                  placeholder="Ask a question..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 text-[14px] text-text-primary bg-transparent border-none outline-none font-sans placeholder:text-text-muted resize-none leading-[1.5]"
                />
                <button
                  onClick={() => {
                    handleSend()
                    if (inputRef.current) inputRef.current.style.height = 'auto'
                  }}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-lg border-none bg-accent-brand flex items-center justify-center cursor-pointer text-white transition-all hover:bg-[#111] disabled:pointer-events-none shrink-0"
                >
                  <ArrowUpIcon className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
