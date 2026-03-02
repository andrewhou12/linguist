'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getTokenizer,
  tokenizeJapanese,
  isTokenizerReady,
  type TokenResult,
} from '@/lib/kuromoji-tokenizer'

type MasteryTier = 'new' | 'apprentice' | 'journeyman' | 'expert' | 'master' | 'burned'

export interface AnnotatedToken extends TokenResult {
  masteryState?: string
  itemId?: number
  tier: MasteryTier
}

export interface ComprehensionStats {
  total: number
  known: number
  learning: number
  unknown: number
  percentage: number
}

function masteryToTier(state?: string): MasteryTier {
  if (!state) return 'new'
  if (state.startsWith('apprentice')) return 'apprentice'
  if (state === 'journeyman') return 'journeyman'
  if (state === 'expert') return 'expert'
  if (state === 'master') return 'master'
  if (state === 'burned') return 'burned'
  if (state === 'introduced' || state === 'unseen') return 'new'
  return 'new'
}

export function useLivingText() {
  const [ready, setReady] = useState(isTokenizerReady())
  const [loading, setLoading] = useState(false)
  const masteryCache = useRef<Record<string, { masteryState: string; id: number }> | null>(null)

  // Lazy-load the tokenizer
  useEffect(() => {
    if (ready) return
    setLoading(true)
    getTokenizer()
      .then(() => setReady(true))
      .catch((err) => console.error('[useLivingText] Tokenizer load failed:', err))
      .finally(() => setLoading(false))
  }, [ready])

  // Fetch mastery data once
  useEffect(() => {
    if (masteryCache.current) return
    fetch('/api/ime/mastery-bulk')
      .then((res) => res.json())
      .then((data) => {
        masteryCache.current = data
      })
      .catch((err) => console.error('[useLivingText] Mastery fetch failed:', err))
  }, [])

  const annotateText = useCallback(
    async (text: string): Promise<AnnotatedToken[]> => {
      const tokens = await tokenizeJapanese(text)
      const mastery = masteryCache.current ?? {}

      return tokens.map((token) => {
        const entry = mastery[token.surface] ?? mastery[token.baseForm ?? '']
        return {
          ...token,
          masteryState: entry?.masteryState,
          itemId: entry?.id,
          tier: masteryToTier(entry?.masteryState),
        }
      })
    },
    []
  )

  const computeComprehension = useCallback(
    (tokens: AnnotatedToken[]): ComprehensionStats => {
      const contentTokens = tokens.filter((t) => t.isContentWord)
      if (contentTokens.length === 0) {
        return { total: 0, known: 0, learning: 0, unknown: 0, percentage: 100 }
      }

      let known = 0
      let learning = 0
      let unknown = 0

      for (const token of contentTokens) {
        const tier = token.tier
        if (tier === 'expert' || tier === 'master' || tier === 'burned') {
          known++
        } else if (tier === 'apprentice' || tier === 'journeyman') {
          learning++
        } else {
          unknown++
        }
      }

      const percentage = Math.round(((known + learning) / contentTokens.length) * 100)
      return { total: contentTokens.length, known, learning, unknown, percentage }
    },
    []
  )

  return {
    ready,
    loading,
    annotateText,
    computeComprehension,
  }
}
