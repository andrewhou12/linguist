'use client'

import { cn } from '@/lib/utils'

export interface Choice {
  number: number
  text: string
  hint?: string
}

interface ChoiceButtonsProps {
  choices: Choice[]
  blockId: string
  isChosen: boolean
  onSelect: (text: string, blockId: string) => void
}

export function ChoiceButtons({ choices, blockId, isChosen, onSelect }: ChoiceButtonsProps) {
  return (
    <div className="flex flex-col gap-2 my-3">
      {choices.map((choice, i) => (
        <button
          key={i}
          className={cn(
            'flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all',
            isChosen
              ? 'opacity-50 cursor-default border-border-subtle bg-bg-secondary'
              : 'cursor-pointer border-border-subtle bg-bg-pure hover:border-accent-brand hover:shadow-[var(--shadow-sm)] active:scale-[0.98]'
          )}
          onClick={() => {
            if (!isChosen) {
              onSelect(choice.text, blockId)
            }
          }}
          disabled={isChosen}
        >
          <span className="text-[14px] font-jp font-medium text-text-primary">
            {choice.number}. {choice.text}
          </span>
          {choice.hint && (
            <span className="text-[12px] text-text-muted mt-0.5">
              {choice.hint}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function ChoiceButtonsSkeleton() {
  return (
    <div className="flex flex-col gap-2 my-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-4 py-3 rounded-xl border border-border-subtle bg-bg-secondary">
          <div className="h-4 w-48 bg-bg-hover rounded" />
        </div>
      ))}
    </div>
  )
}
