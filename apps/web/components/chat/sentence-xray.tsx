'use client'

import { useState } from 'react'
import { Scan, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface XRayToken {
  surface: string
  reading: string
  romaji: string
  pos: string
  meaning: string
}

export const posColors: Record<string, string> = {
  noun: 'bg-blue-soft text-blue',
  verb: 'bg-green-soft text-green',
  adj: 'bg-purple-soft text-purple',
  particle: 'bg-bg-secondary text-text-muted',
  adverb: 'bg-warm-soft text-accent-warm',
  conj: 'bg-bg-secondary text-text-secondary',
  aux: 'bg-bg-secondary text-text-muted',
  punct: 'bg-transparent text-text-muted',
  other: 'bg-bg-secondary text-text-secondary',
}

export function XRayTokenGrid({ tokens }: { tokens: XRayToken[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((token, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 px-1.5 py-1">
          <span className="text-[10px] text-text-muted font-mono">{token.romaji}</span>
          <span className="text-[15px] font-jp font-medium text-text-primary">{token.surface}</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-medium',
              posColors[token.pos] ?? posColors.other
            )}
          >
            {token.pos}
          </span>
          <span className="text-[10px] text-text-secondary text-center max-w-[80px] leading-tight">{token.meaning}</span>
        </div>
      ))}
    </div>
  )
}

interface SentenceXRayButtonProps {
  sentence: string
}

export function SentenceXRayButton({ sentence }: SentenceXRayButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState<XRayToken[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }

    if (tokens) {
      setIsOpen(true)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await api.conversationXray(sentence)
      setTokens(result.tokens)
      setIsOpen(true)
    } catch {
      setError('Failed to analyze sentence')
    }
    setIsLoading(false)
  }

  return (
    <div className="mt-1.5">
      <button
        onClick={handleClick}
        disabled={isLoading}
        title="X-Ray (or select text + ⌘E)"
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border-none cursor-pointer transition-colors',
          isOpen
            ? 'bg-accent-brand/10 text-accent-brand'
            : 'bg-transparent text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-secondary hover:bg-bg-hover'
        )}
      >
        {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Scan size={11} />}
        X-Ray
      </button>

      {error && (
        <span className="text-[11px] text-accent-warm ml-2">{error}</span>
      )}

      {isOpen && tokens && (
        <div className="mt-2 p-3 bg-bg-secondary rounded-lg border border-border-subtle">
          <XRayTokenGrid tokens={tokens} />
        </div>
      )}
    </div>
  )
}
