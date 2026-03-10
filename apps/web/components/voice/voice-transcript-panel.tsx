'use client'

import { useRef, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { stripRubyAnnotations } from '@/lib/ruby-annotator'
import type { TranscriptLine } from '@/hooks/use-voice-conversation'

interface CorrectionInfo {
  original: string
  corrected: string
  explanation: string
}

interface TranscriptEntry extends TranscriptLine {
  correction?: CorrectionInfo | null
  formattedTime?: string
}

interface VoiceTranscriptPanelProps {
  isOpen: boolean
  entries: TranscriptEntry[]
  onClose: () => void
}

export function VoiceTranscriptPanel({ isOpen, entries, onClose }: VoiceTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, isOpen])

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
          <div className="text-[13px] font-semibold text-text-primary tracking-[-0.01em]">Transcript</div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {entries.length} message{entries.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-transparent border-none text-text-muted cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Transcript entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
        {entries.length === 0 ? (
          <div className="text-center py-8 px-4 text-text-muted text-[13px] leading-[1.7]">
            Start the conversation and your full transcript will appear here in real time.
          </div>
        ) : (
          entries.map((entry, i) => {
            const isUser = entry.role === 'user'
            return (
              <div key={i} className={cn('flex flex-col gap-1', isUser && 'items-end')}>
                {/* Role label + timestamp */}
                <div className={cn('flex items-center gap-1.5 px-1', isUser && 'flex-row-reverse')}>
                  <span className="text-[11px] font-medium text-text-muted">
                    {isUser ? 'You' : 'Sensei'}
                  </span>
                  {entry.formattedTime && (
                    <span className="text-[10px] font-mono text-text-muted">
                      {entry.formattedTime}
                    </span>
                  )}
                </div>

                {/* Message bubble — matches message-block patterns */}
                <div
                  className={cn(
                    'max-w-[90%] px-3.5 py-2 text-[13px] font-jp-clean leading-[1.65]',
                    isUser
                      ? 'bg-accent-brand text-white rounded-[12px_12px_4px_12px]'
                      : 'bg-bg-secondary border border-border text-text-primary rounded-[12px_12px_12px_4px]',
                  )}
                >
                  {stripRubyAnnotations(entry.text)}
                </div>

                {/* Correction card — uses app's warm color system */}
                {entry.correction && (
                  <div className="max-w-[90%] rounded-xl border border-warm-med bg-warm-soft px-3 py-2 mt-0.5">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[11px] text-text-muted shrink-0">before</span>
                      <span className="text-[13px] font-jp-clean text-text-secondary line-through">
                        {entry.correction.original}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[11px] text-text-muted shrink-0">after</span>
                      <span className="text-[13px] font-jp-clean font-medium text-text-primary">
                        {entry.correction.corrected}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-snug">
                      {entry.correction.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
