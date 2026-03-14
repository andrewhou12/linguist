'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { XMarkIcon, ArrowUpIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { TurnAnalysisResult } from '@/lib/session-types'

interface LookupResult {
  word: string
  reading?: string
  meaning: string
  partOfSpeech?: string
  exampleSentence?: string
  notes?: string
}

interface ChatMessage {
  role: 'user' | 'ai' | 'system' | 'lookup'
  text: string
  lookup?: LookupResult
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
  lookupWord?: string | null
  onClearLookupWord?: () => void
  targetLanguage?: string
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
    for (const a of result.alternativeExpressions || []) {
      const key = `a::${a.original}`
      if (seen.has(key)) continue
      seen.add(key)
      cards.push({ type: 'naturalness', original: a.original, corrected: a.alternative, explanation: a.explanation })
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

function LookupCard({ result, onAskMore }: { result: LookupResult; onAskMore?: (q: string) => void }) {
  return (
    <div className="border-l-[3px] border-l-blue rounded-xl bg-bg-pure border border-border px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-[16px] font-semibold font-jp-clean text-text-primary">{result.word}</span>
        {result.reading && (
          <span className="text-[13px] text-text-secondary font-jp-clean">{result.reading}</span>
        )}
        {result.partOfSpeech && (
          <span className="text-[10.5px] font-medium bg-bg-secondary rounded-full px-2 py-0.5 text-text-muted">
            {result.partOfSpeech}
          </span>
        )}
      </div>
      <p className="text-[14px] text-text-primary leading-[1.5] mb-1">{result.meaning}</p>
      {result.exampleSentence && (
        <p className="text-[13px] text-text-secondary leading-[1.5] font-jp-clean">{result.exampleSentence}</p>
      )}
      {result.notes && (
        <p className="text-[12px] text-text-muted mt-1 leading-[1.5]">{result.notes}</p>
      )}
      {onAskMore && (
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => onAskMore(`Give me 5 example sentences using ${result.word}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-secondary border border-border text-[12px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            5 examples
          </button>
          <button
            onClick={() => onAskMore(`Explain the nuances of ${result.word} vs similar words`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-secondary border border-border text-[12px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Compare similar
          </button>
        </div>
      )}
    </div>
  )
}

type Tab = 'feedback' | 'chat'

export function UnifiedChatOverlay({
  isOpen,
  onClose,
  analysisResults,
  recentHistory,
  onRetry,
  onAddNote,
  lookupWord,
  onClearLookupWord,
  targetLanguage,
}: UnifiedChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('feedback')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const feedbackCards = extractFeedbackCards(analysisResults)

  // Switch to feedback tab when new feedback arrives
  const prevFeedbackCount = useRef(feedbackCards.length)
  useEffect(() => {
    if (feedbackCards.length > prevFeedbackCount.current && isOpen) {
      setActiveTab('feedback')
    }
    prevFeedbackCount.current = feedbackCards.length
  }, [feedbackCards.length, isOpen])

  // Handle incoming lookupWord from subtitles — switch to chat tab
  const processedLookupRef = useRef<string | null>(null)
  useEffect(() => {
    if (lookupWord && isOpen && lookupWord !== processedLookupRef.current) {
      processedLookupRef.current = lookupWord
      setActiveTab('chat')
      handleLookup(lookupWord)
      onClearLookupWord?.()
    }
  }, [lookupWord, isOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen, feedbackCards.length])

  // Focus input when chat tab opened
  useEffect(() => {
    if (isOpen && activeTab === 'chat' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, activeTab])

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
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
        body: JSON.stringify({ query, recentHistory, targetLanguage }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(m => [...m, { role: 'ai', text: data.suggestion }])
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
    setActiveTab('chat')
    const query = `Give me 5 examples of ${topic}`
    setMessages(m => [...m, { role: 'user', text: query }])
    setLoading(true)

    try {
      const res = await fetch('/api/conversation/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, recentHistory, targetLanguage }),
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

  const handleLookup = useCallback(async (word: string) => {
    if (lookupLoading) return
    setMessages(m => [...m, { role: 'system', text: `Looking up "${word}"...` }])
    setLookupLoading(true)

    try {
      const res = await fetch('/api/conversation/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, context: recentHistory.slice(-2).map(h => h.content).join(' '), targetLanguage }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(m => {
          const filtered = m.filter(msg => msg.text !== `Looking up "${word}"...`)
          return [...filtered, { role: 'lookup' as const, text: word, lookup: data }]
        })
        onAddNote?.(`Looked up: ${word}`)
      } else {
        setMessages(m => {
          const filtered = m.filter(msg => msg.text !== `Looking up "${word}"...`)
          return [...filtered, { role: 'ai', text: `Couldn't look up "${word}" right now.` }]
        })
      }
    } catch {
      setMessages(m => {
        const filtered = m.filter(msg => msg.text !== `Looking up "${word}"...`)
        return [...filtered, { role: 'ai', text: 'Something went wrong looking up that word.' }]
      })
    } finally {
      setLookupLoading(false)
    }
  }, [lookupLoading, recentHistory, onAddNote])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none"
          >
    <div className="w-full max-w-[640px] max-h-[85vh] bg-bg-pure border border-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,.12),0_4px_16px_rgba(0,0,0,.08)] flex flex-col overflow-hidden pointer-events-auto">
      {/* Header with tabs */}
      <div className="px-6 pt-4 pb-0 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <kbd className="font-mono text-[10px] font-medium px-1 py-0.5 rounded bg-bg-secondary border border-border text-text-muted">F</kbd>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-text-muted cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <XMarkIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('feedback')}
            className={cn(
              'px-4 py-2 text-[13px] font-medium border-none cursor-pointer transition-colors bg-transparent relative',
              activeTab === 'feedback'
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Feedback
            {feedbackCards.length > 0 && (
              <span className="ml-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full text-[11px] font-bold px-1 bg-warm-soft text-accent-warm">
                {feedbackCards.length}
              </span>
            )}
            {activeTab === 'feedback' && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-accent-brand rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'px-4 py-2 text-[13px] font-medium border-none cursor-pointer transition-colors bg-transparent relative',
              activeTab === 'chat'
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Chat
            {messages.length > 0 && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-text-muted inline-block" />
            )}
            {activeTab === 'chat' && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-accent-brand rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm"
      >
        {activeTab === 'feedback' && (
          <>
            {feedbackCards.length > 0 ? (
              feedbackCards.map((card, i) => (
                <FeedbackCardInline
                  key={i}
                  card={card}
                  onRetry={onRetry}
                  onExamples={handleExamples}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-border flex items-center justify-center mb-3 text-text-muted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[13px] text-text-secondary font-medium mb-1">No feedback yet</p>
                <p className="text-[12px] text-text-muted leading-[1.5] max-w-[260px]">
                  Corrections and tips appear here after each exchange. Keep talking!
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'chat' && (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col gap-4 py-4">
                {/* Quick actions */}
                <div>
                  <p className="text-[12px] text-text-muted font-medium mb-2 px-1">Try asking</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { text: 'What did they just say?' },
                      { text: 'How should I respond?' },
                      { text: 'Explain the grammar they used' },
                    ].map(({ text }) => (
                      <button
                        key={text}
                        onClick={() => {
                          setInput(text)
                          inputRef.current?.focus()
                        }}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-bg-pure text-left cursor-pointer transition-all hover:bg-bg-hover hover:border-border-strong group"
                      >
                        <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">{text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[12px] text-text-muted leading-[1.5] text-center mt-1">
                  Click words in the subtitles to look them up here.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === 'user' ? (
                  <div className="bg-bg-secondary rounded-xl px-3.5 py-2.5 ml-8">
                    <p className="text-[14px] text-text-primary leading-[1.6]">{m.text}</p>
                  </div>
                ) : m.role === 'lookup' && m.lookup ? (
                  <LookupCard result={m.lookup} onAskMore={(q) => { setInput(q); inputRef.current?.focus() }} />
                ) : m.role === 'system' ? (
                  <div className="text-[12px] text-text-muted italic text-center py-2">{m.text}</div>
                ) : (
                  <div className="text-[14px] text-text-secondary leading-[1.7] prose-help">
                    <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
                  </div>
                )}
              </div>
            ))}
            {(loading || lookupLoading) && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted/50 animate-[voice-loading-dot_1.2s_ease-in-out_infinite]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted/50 animate-[voice-loading-dot_1.2s_ease-in-out_0.2s_infinite]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted/50 animate-[voice-loading-dot_1.2s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input footer — only show on chat tab */}
      {activeTab === 'chat' && (
        <div className="px-6 py-3 border-t border-border shrink-0">
          <div className="relative bg-bg-pure border border-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-[border-color,box-shadow] duration-150 focus-within:border-border-strong focus-within:shadow-[0_2px_8px_rgba(0,0,0,.06)]">
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
              placeholder="Ask a question or look up a word..."
              rows={1}
              className="w-full px-3.5 py-2.5 pr-20 text-[14px] text-text-primary bg-transparent border-none outline-none font-sans placeholder:text-text-muted resize-none leading-[1.5]"
            />
            <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
              <button
                onClick={() => {
                  if (input.trim()) handleLookup(input.trim())
                }}
                disabled={!input.trim() || lookupLoading}
                className="w-7 h-7 rounded-md border border-border bg-bg-secondary flex items-center justify-center cursor-pointer text-text-muted transition-all hover:bg-bg-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-30 shrink-0"
                title="Look up word"
              >
                <MagnifyingGlassIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  handleSend()
                  if (inputRef.current) inputRef.current.style.height = 'auto'
                }}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-md border-none bg-accent-brand flex items-center justify-center cursor-pointer text-white transition-all hover:bg-[#111] disabled:pointer-events-none shrink-0"
              >
                <ArrowUpIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
