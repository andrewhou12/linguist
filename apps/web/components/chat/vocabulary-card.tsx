'use client'

interface VocabularyCardProps {
  word: string
  reading?: string
  meaning: string
  partOfSpeech?: string
  exampleSentence?: string
  notes?: string
}

export function VocabularyCard({ word, reading, meaning, partOfSpeech, exampleSentence, notes }: VocabularyCardProps) {
  return (
    <div className="my-3 rounded-xl border border-blue-med bg-blue-soft px-4 py-3">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[18px] font-jp font-semibold text-text-primary">{word}</span>
        {reading && (
          <span className="text-[13px] font-jp text-blue">{reading}</span>
        )}
        {partOfSpeech && (
          <span className="text-[11px] text-blue/70 bg-blue-med rounded-full px-2 py-0.5">
            {partOfSpeech}
          </span>
        )}
      </div>
      <p className="text-[14px] text-text-primary mb-1">{meaning}</p>
      {exampleSentence && (
        <p className="text-[13px] font-jp text-text-secondary leading-snug mt-2 pl-3 border-l-2 border-blue-med">
          {exampleSentence}
        </p>
      )}
      {notes && (
        <p className="text-[12px] text-text-muted mt-2 italic">{notes}</p>
      )}
    </div>
  )
}

export function VocabularyCardSkeleton() {
  return (
    <div className="my-3 rounded-xl border border-blue-med bg-blue-soft px-4 py-3 animate-pulse">
      <div className="flex items-baseline gap-2 mb-2">
        <div className="h-5 w-16 bg-blue-med rounded" />
        <div className="h-3 w-12 bg-blue-med rounded" />
      </div>
      <div className="h-4 w-40 bg-blue-med rounded mb-1" />
      <div className="h-3 w-56 bg-blue-med rounded mt-2" />
    </div>
  )
}
