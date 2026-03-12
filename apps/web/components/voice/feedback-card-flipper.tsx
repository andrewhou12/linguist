'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { TurnAnalysisResult } from '@/lib/session-types'

interface FeedbackItem {
  type: 'correction' | 'naturalness' | 'register' | 'culture'
  label: string
  original?: string
  corrected?: string
  tip?: string
  explanation: string
  grammarPoint?: string
}

interface FeedbackCardFlipperProps {
  analysisResults: Record<number, TurnAnalysisResult>
  onRetry?: () => void
  onOpenChat?: (context?: string) => void
  className?: string
}

const TYPE_BORDER: Record<FeedbackItem['type'], string> = {
  correction: 'border-l-accent-warm',
  naturalness: 'border-l-blue',
  register: 'border-l-purple',
  culture: 'border-l-purple',
}

const TYPE_LABEL: Record<FeedbackItem['type'], { text: string; bg: string; fg: string }> = {
  correction: { text: 'Correction', bg: 'bg-warm-soft', fg: 'text-accent-warm' },
  naturalness: { text: 'More natural', bg: 'bg-blue-soft', fg: 'text-blue' },
  register: { text: 'Register', bg: 'bg-purple-soft', fg: 'text-purple' },
  culture: { text: 'Culture tip', bg: 'bg-purple-soft', fg: 'text-purple' },
}

function extractFeedbackItems(results: Record<number, TurnAnalysisResult>): FeedbackItem[] {
  const items: FeedbackItem[] = []
  const seen = new Set<string>()

  for (const result of Object.values(results)) {
    for (const c of result.corrections) {
      const key = `c::${c.original}::${c.corrected}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        type: 'correction',
        label: 'Correction',
        original: c.original,
        corrected: c.corrected,
        explanation: c.explanation,
        grammarPoint: c.grammarPoint,
      })
    }
    for (const n of result.naturalnessFeedback) {
      const key = `n::${n.original}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        type: 'naturalness',
        label: 'More natural',
        original: n.original,
        corrected: n.suggestion,
        explanation: n.explanation,
      })
    }
    for (const r of result.registerMismatches || []) {
      const key = `r::${r.original}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        type: 'register',
        label: 'Register',
        original: r.original,
        corrected: r.suggestion,
        explanation: r.explanation,
      })
    }
    for (const t of result.conversationalTips || []) {
      const key = `t::${t.tip.slice(0, 30)}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        type: 'culture',
        label: 'Culture tip',
        tip: t.tip,
        explanation: t.explanation,
      })
    }
  }

  return items
}

export function FeedbackCardFlipper({ analysisResults, onRetry, onOpenChat, className }: FeedbackCardFlipperProps) {
  const items = useMemo(() => extractFeedbackItems(analysisResults), [analysisResults])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [prevCount, setPrevCount] = useState(0)

  // Auto-show when new items arrive
  useEffect(() => {
    if (items.length > prevCount && items.length > 0) {
      setCurrentIdx(items.length - 1)
      setDismissed(false)
    }
    setPrevCount(items.length)
  }, [items.length, prevCount])

  const goNext = useCallback(() => {
    setCurrentIdx(i => Math.min(i + 1, items.length - 1))
  }, [items.length])

  const goPrev = useCallback(() => {
    setCurrentIdx(i => Math.max(i - 1, 0))
  }, [])

  if (items.length === 0 || dismissed) return null

  const item = items[currentIdx]
  if (!item) return null

  const typeStyle = TYPE_LABEL[item.type]
  const borderColor = TYPE_BORDER[item.type]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed bottom-28 right-8 z-[50] w-[320px]',
          className,
        )}
      >
        <div className={cn(
          'rounded-xl bg-bg-pure border border-border shadow-[0_4px_24px_rgba(0,0,0,.1),0_2px_8px_rgba(0,0,0,.06)] px-4 py-3.5 border-l-[3px]',
          borderColor,
        )}>
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center bg-transparent border-none text-text-muted cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Type label pill */}
          <span className={cn(
            'inline-flex text-[10.5px] font-medium rounded-full px-2 py-0.5 mb-2',
            typeStyle.bg, typeStyle.fg,
          )}>
            {typeStyle.text}
          </span>

          {/* Content */}
          {item.original && (
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[14px] font-jp-clean text-text-muted line-through">{item.original}</span>
              <span className="text-text-muted text-[12px]">&rarr;</span>
              <span className="text-[14px] font-jp-clean font-medium text-text-primary">{item.corrected}</span>
            </div>
          )}
          {item.tip && (
            <div className="text-[14px] font-medium text-text-primary mb-1.5">{item.tip}</div>
          )}
          <p className="text-[13px] text-text-secondary leading-[1.5] pr-4">{item.explanation}</p>
          {item.grammarPoint && (
            <span className="inline-flex text-[10.5px] font-medium text-text-secondary bg-bg-secondary rounded-full px-2 py-0.5 mt-1.5 font-sans">
              {item.grammarPoint}
            </span>
          )}

          {/* Navigation */}
          {items.length > 1 && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={goPrev}
                  disabled={currentIdx === 0}
                  className="w-7 h-7 rounded-md bg-bg-secondary flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-bg-hover disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5 text-text-secondary" />
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIdx === items.length - 1}
                  className="w-7 h-7 rounded-md bg-bg-secondary flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-bg-hover disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5 text-text-secondary" />
                </button>
              </div>

              {/* Dots */}
              <div className="flex items-center gap-1">
                {items.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      i === currentIdx ? 'bg-text-primary' : 'bg-border-strong',
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-[12px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary hover:border-border-strong"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
            {onOpenChat && (
              <button
                onClick={() => onOpenChat?.(item.grammarPoint || item.corrected || item.tip)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-[12px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary hover:border-border-strong"
              >
                Open in chat
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
