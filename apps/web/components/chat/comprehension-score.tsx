'use client'

import type { ComprehensionStats } from '@/hooks/use-living-text'

interface ComprehensionScoreProps {
  stats: ComprehensionStats
}

export function ComprehensionScore({ stats }: ComprehensionScoreProps) {
  if (stats.total === 0) return null

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="h-1.5 flex-1 max-w-[120px] bg-bg-active rounded-full overflow-hidden">
        <div
          className="h-full bg-green rounded-full transition-all"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
      <span className="text-[11px] text-text-muted">
        {stats.percentage}% known
        {stats.unknown > 0 && ` · ${stats.unknown} new`}
      </span>
    </div>
  )
}
