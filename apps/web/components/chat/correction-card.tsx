'use client'

import { cn } from '@/lib/utils'

interface CorrectionCardProps {
  original: string
  corrected: string
  explanation: string
  grammarPoint?: string
}

export function CorrectionCard({ original, corrected, explanation, grammarPoint }: CorrectionCardProps) {
  return (
    <div className="my-3 rounded-xl border border-warm-med bg-warm-soft px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-semibold text-accent-warm uppercase tracking-wide">Correction</span>
        {grammarPoint && (
          <span className="text-[11px] text-accent-warm/70 bg-warm-med rounded-full px-2 py-0.5">
            {grammarPoint}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] text-text-muted shrink-0">before</span>
          <span className="text-[14px] font-jp text-text-secondary line-through">{original}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] text-text-muted shrink-0">after</span>
          <span className="text-[14px] font-jp font-medium text-text-primary">{corrected}</span>
        </div>
      </div>
      <p className="text-[13px] text-text-secondary leading-snug">{explanation}</p>
    </div>
  )
}

export function CorrectionCardSkeleton() {
  return (
    <div className="my-3 rounded-xl border border-warm-med bg-warm-soft px-4 py-3 animate-pulse">
      <div className="h-3 w-20 bg-warm-med rounded mb-3" />
      <div className="flex flex-col gap-2 mb-2">
        <div className="h-4 w-48 bg-warm-med rounded" />
        <div className="h-4 w-52 bg-warm-med rounded" />
      </div>
      <div className="h-3 w-64 bg-warm-med rounded" />
    </div>
  )
}
