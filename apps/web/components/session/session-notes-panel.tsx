'use client'

import { useMemo } from 'react'
import { LightBulbIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { getTargetFontCleanClass } from '@/lib/languages'
import { useLanguage } from '@/hooks/use-language'
import type { TurnAnalysisResult } from '@/lib/session-types'

interface SessionNotesPanelProps {
  analysisResults: Record<number, TurnAnalysisResult>
  highlight?: boolean
  isAnalyzing?: boolean
  onOpenFeedback?: () => void
}

// Border color classes by note type
const BORDER_COLORS = {
  correction: 'border-l-accent-warm',
  production: 'border-l-green',
  learning: 'border-l-blue',
  culture: 'border-l-purple',
  takeaway: 'border-l-green',
} as const

type NoteType = keyof typeof BORDER_COLORS

interface NarrativeNote {
  key: string
  type: NoteType
  text: string
}

function formatCorrectionNote(c: { original: string; corrected: string; explanation: string }): string {
  return `Cleared confusion on ${c.original} → ${c.corrected} — ${c.explanation}`
}

function formatRegisterNote(r: { original: string; suggestion: string; explanation: string }): string {
  return `Register fix: ${r.original} → ${r.suggestion} — ${r.explanation}`
}

function formatL1Note(l: { original: string; issue: string; suggestion: string }): string {
  return `Fixed L1 transfer: ${l.issue} — use ${l.suggestion} instead`
}

function formatAlternativeNote(a: { original: string; alternative: string; explanation: string }): string {
  return `Learned that ${a.alternative} sounds more natural than ${a.original} — ${a.explanation}`
}

function formatNaturalnessNote(n: { original: string; suggestion: string; explanation: string }): string {
  return `Better phrasing: ${n.suggestion} instead of ${n.original}`
}

function formatGrammarNote(g: { pattern: string; meaning: string }): string {
  return `Practiced ${g.pattern} — ${g.meaning}`
}

function formatVocabNote(v: { word: string; meaning: string }): string {
  return `New word: ${v.word} — ${v.meaning}`
}

function formatTipNote(t: { tip: string }): string {
  return t.tip
}

export function SessionNotesPanel({ analysisResults, highlight, isAnalyzing, onOpenFeedback }: SessionNotesPanelProps) {
  const { targetLanguage } = useLanguage()
  const fontClean = getTargetFontCleanClass(targetLanguage || 'Japanese')
  void fontClean // used in future inline rendering if needed

  // Build narrative notes from all turns, deduplicating by key
  const notes = useMemo(() => {
    const noteMap = new Map<string, NarrativeNote>()

    for (const result of Object.values(analysisResults)) {
      // Corrections
      for (const c of result.corrections) {
        const key = `correction::${c.original}::${c.corrected}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'correction', text: formatCorrectionNote(c) })
        }
      }

      // Register mismatches
      for (const r of result.registerMismatches || []) {
        const key = `register::${r.original}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'correction', text: formatRegisterNote(r) })
        }
      }

      // L1 interference
      for (const l of result.l1Interference || []) {
        const key = `l1::${l.original}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'correction', text: formatL1Note(l) })
        }
      }

      // Alternative expressions
      for (const a of result.alternativeExpressions || []) {
        const key = `alt::${a.original}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'learning', text: formatAlternativeNote(a) })
        }
      }

      // Naturalness feedback
      for (const n of result.naturalnessFeedback) {
        const key = `nat::${n.original}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'learning', text: formatNaturalnessNote(n) })
        }
      }

      // Grammar notes
      for (const g of result.grammarNotes) {
        const key = `grammar::${g.pattern}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'production', text: formatGrammarNote(g) })
        }
      }

      // Vocabulary
      for (const v of result.vocabularyCards) {
        const key = `vocab::${v.word}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'learning', text: formatVocabNote(v) })
        }
      }

      // Conversational tips
      for (const t of result.conversationalTips || []) {
        const key = `tip::${t.tip.slice(0, 30)}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'culture', text: formatTipNote(t) })
        }
      }

      // Takeaways
      for (const t of result.takeaways || []) {
        const key = `takeaway::${t.slice(0, 30)}`
        if (!noteMap.has(key)) {
          noteMap.set(key, { key, type: 'takeaway', text: t })
        }
      }
    }

    return Array.from(noteMap.values())
  }, [analysisResults])

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
      <div className="flex-1 overflow-y-auto px-4 pb-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
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
          <div className="flex flex-col gap-2">
            {notes.map((note) => (
              <div
                key={note.key}
                className={cn(
                  'border-l-[3px] pl-3 py-2 animate-[voice-fade-up_0.3s_ease_both]',
                  BORDER_COLORS[note.type],
                )}
              >
                <p className="text-[13px] text-text-primary leading-[1.55]">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
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
