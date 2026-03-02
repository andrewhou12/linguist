'use client'

import { cn } from '@/lib/utils'

type NaturalnessRating = 'great' | 'good' | 'needs_work'

interface NaturalnessBadgeProps {
  rating: NaturalnessRating
  note?: string
}

const ratingConfig: Record<NaturalnessRating, { label: string; classes: string }> = {
  great: {
    label: 'Natural',
    classes: 'bg-green-soft text-green',
  },
  good: {
    label: 'Good',
    classes: 'bg-blue-soft text-blue',
  },
  needs_work: {
    label: 'Needs work',
    classes: 'bg-warm-soft text-accent-warm',
  },
}

export function NaturalnessBadge({ rating, note }: NaturalnessBadgeProps) {
  const config = ratingConfig[rating]
  if (!config) return null

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
          config.classes
        )}
      >
        {config.label}
      </span>
      {note && (
        <span className="text-[11px] text-text-muted">{note}</span>
      )}
    </div>
  )
}
