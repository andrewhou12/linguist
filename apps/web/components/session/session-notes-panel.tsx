'use client'

import { useMemo } from 'react'
import { LightBulbIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { TurnAnalysisResult } from '@/lib/session-types'

interface SessionNotesPanelProps {
  analysisResults: Record<number, TurnAnalysisResult>
  highlight?: boolean
  isAnalyzing?: boolean
  onOpenFeedback?: () => void
}

interface Note {
  key: string
  text: string
}

function buildNotes(analysisResults: Record<number, TurnAnalysisResult>): Note[] {
  const noteMap = new Map<string, Note>()

  for (const result of Object.values(analysisResults)) {
    for (const c of result.corrections) {
      const key = `c::${c.original}::${c.corrected}`
      if (!noteMap.has(key)) {
        const label = c.grammarPoint ? ` (${c.grammarPoint})` : ''
        noteMap.set(key, { key, text: `${c.original} → ${c.corrected}${label}` })
      }
    }

    for (const t of result.takeaways || []) {
      const key = `t::${t.slice(0, 40)}`
      if (!noteMap.has(key)) {
        noteMap.set(key, { key, text: t })
      }
    }

    for (const a of result.alternativeExpressions || []) {
      const key = `a::${a.original}`
      if (!noteMap.has(key)) {
        noteMap.set(key, { key, text: `${a.original} → ${a.alternative}` })
      }
    }
  }

  return Array.from(noteMap.values())
}

export function SessionNotesPanel({ analysisResults, highlight, isAnalyzing, onOpenFeedback }: SessionNotesPanelProps) {
  const notes = useMemo(() => buildNotes(analysisResults), [analysisResults])

  return (
    <div className={cn(
      "fixed right-6 top-[72px] bottom-6 z-[9] w-[280px] flex flex-col bg-bg-pure border rounded-lg shadow-[0_1px_2px_rgba(0,0,0,.04),0_1px_4px_rgba(0,0,0,.03)] overflow-hidden transition-[border-color] duration-500",
      highlight ? 'border-accent-brand' : 'border-border-subtle',
    )}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-text-secondary">Session Notes</span>
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-[12px] text-text-muted">
              <span className="w-1 h-1 rounded-full bg-text-muted animate-[voice-loading-dot_1.2s_ease-in-out_infinite]" />
              Analyzing
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center mb-3">
              <LightBulbIcon className="w-5 h-5 text-text-secondary" />
            </div>
            <p className="text-[14px] text-text-secondary leading-[1.5]">
              Notes will appear as you practice
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {notes.map((note) => (
              <li
                key={note.key}
                className="text-[13px] text-text-primary leading-[1.5] animate-[voice-fade-up_0.3s_ease_both] flex gap-2"
              >
                <span className="text-text-muted shrink-0 select-none">&bull;</span>
                <span>{note.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer link */}
      {notes.length > 0 && onOpenFeedback && (
        <div className="px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={onOpenFeedback}
            className="text-[12px] text-text-muted font-medium bg-transparent border-none cursor-pointer hover:text-text-secondary transition-colors"
          >
            See full details &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
