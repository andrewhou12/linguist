'use client'

import { cn } from '@/lib/utils'
import type { DictEntry } from '@/lib/kana-dictionary'

interface IMECandidateRowProps {
  candidate: DictEntry
  index: number
  isSelected: boolean
  onClick: () => void
}

export function IMECandidateRow({ candidate, index, isSelected, onClick }: IMECandidateRowProps) {
  const isKanaOnly = candidate.meaning === '(kana)'

  return (
    <button
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-1.5 text-left border-none cursor-pointer transition-colors',
        isSelected ? 'bg-accent-brand/8' : 'bg-transparent hover:bg-bg-hover',
      )}
      onClick={onClick}
      data-index={index}
    >
      {/* Index number */}
      <span className="text-[11px] text-text-muted w-4 shrink-0 text-right font-mono">
        {index + 1}
      </span>

      {/* Surface form */}
      <span className="text-[14px] font-jp shrink-0 text-text-primary">
        {candidate.surface}
      </span>

      {/* Meaning */}
      <span className="text-[12px] truncate flex-1 min-w-0 text-text-secondary">
        {isKanaOnly ? '' : candidate.meaning}
      </span>

      {/* Kana label */}
      {isKanaOnly && (
        <span className="text-[10px] font-medium shrink-0 text-text-muted">
          kana
        </span>
      )}
    </button>
  )
}
