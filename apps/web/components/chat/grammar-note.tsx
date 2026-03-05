'use client'

interface GrammarNoteProps {
  pattern: string
  meaning: string
  formation: string
  examples: { japanese: string; english: string }[]
  level?: string
}

export function GrammarNote({ pattern, meaning, formation, examples, level }: GrammarNoteProps) {
  return (
    <div className="my-3 rounded-xl border border-purple-med bg-purple-soft px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[16px] font-jp font-semibold text-text-primary">{pattern}</span>
        {level && (
          <span className="text-[11px] text-purple/70 bg-purple-med rounded-full px-2 py-0.5">
            {level}
          </span>
        )}
      </div>
      <p className="text-[14px] text-text-primary mb-1">{meaning}</p>
      <p className="text-[12px] text-text-muted mb-2">{formation}</p>
      <div className="flex flex-col gap-1.5">
        {examples.map((ex, i) => (
          <div key={i} className="pl-3 border-l-2 border-purple-med">
            <p className="text-[13px] font-jp text-text-primary leading-snug">{ex.japanese}</p>
            <p className="text-[12px] text-text-muted">{ex.english}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GrammarNoteSkeleton() {
  return (
    <div className="my-3 rounded-xl border border-purple-med bg-purple-soft px-4 py-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-32 bg-purple-med rounded" />
        <div className="h-4 w-8 bg-purple-med rounded-full" />
      </div>
      <div className="h-4 w-48 bg-purple-med rounded mb-1" />
      <div className="h-3 w-36 bg-purple-med rounded mb-2" />
      <div className="pl-3 border-l-2 border-purple-med">
        <div className="h-3 w-56 bg-purple-med rounded mb-1" />
        <div className="h-3 w-40 bg-purple-med rounded" />
      </div>
    </div>
  )
}
