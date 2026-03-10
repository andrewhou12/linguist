'use client'

import { useRef, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface Correction {
  original: string
  corrected: string
  explanation: string
  grammarPoint?: string
}

interface VoiceCorrectionsPanelProps {
  isOpen: boolean
  corrections: Correction[]
  onClose: () => void
}

export function VoiceCorrectionsPanel({ isOpen, corrections, onClose }: VoiceCorrectionsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [corrections, isOpen])

  return (
    <div
      className={cn(
        'fixed right-0 top-0 bottom-0 w-[308px] z-[100] flex flex-col transition-transform duration-[400ms] ease-[cubic-bezier(.76,0,.24,1)]',
        'bg-bg-pure backdrop-blur-[24px] border-l border-border',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div>
          <div className="text-[13px] font-semibold text-text-primary tracking-[-0.01em]">Corrections</div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {corrections.length} correction{corrections.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-transparent border-none text-text-muted cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Corrections list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
        {corrections.length === 0 ? (
          <div className="text-center py-8 px-4 text-text-muted text-[13px] leading-[1.7]">
            No corrections yet — keep talking!
          </div>
        ) : (
          corrections.map((c, i) => (
            <div key={i} className="rounded-xl border border-warm-med bg-warm-soft px-3 py-2.5 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-text-muted shrink-0">before</span>
                <span className="text-[13px] font-jp-clean text-text-secondary line-through">{c.original}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-text-muted shrink-0">after</span>
                <span className="text-[13px] font-jp-clean font-medium text-text-primary">{c.corrected}</span>
              </div>
              <p className="text-[12px] text-text-secondary leading-snug mt-0.5">{c.explanation}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
