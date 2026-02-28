'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { DictEntry } from '@/lib/kana-dictionary'

export interface MasteryInfo {
  masteryState: string
  id: number
}

export interface EnrichedCandidate extends DictEntry {
  mastery: MasteryInfo | null
}

/**
 * Cross-references dictionary candidates with the learner's word bank.
 * Debounced API call with per-surface-form caching.
 */
export function useIMEMastery(candidates: DictEntry[]): EnrichedCandidate[] {
  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryInfo>>({})
  const cacheRef = useRef<Record<string, MasteryInfo | null>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchMastery = useCallback(async (surfaceForms: string[]) => {
    try {
      const res = await fetch('/api/ime/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaceForms }),
      })
      if (!res.ok) return
      const data: Record<string, MasteryInfo> = await res.json()

      // Update cache
      for (const sf of surfaceForms) {
        cacheRef.current[sf] = data[sf] ?? null
      }
      // Update state with all cached data
      const newMap: Record<string, MasteryInfo> = {}
      for (const [sf, info] of Object.entries(cacheRef.current)) {
        if (info) newMap[sf] = info
      }
      setMasteryMap(newMap)
    } catch {
      // Silently fail — mastery indicators are non-critical
    }
  }, [])

  useEffect(() => {
    if (candidates.length === 0) return

    // Find surface forms not yet cached
    const uncached = candidates
      .map((c) => c.surface)
      .filter((sf) => !(sf in cacheRef.current))

    if (uncached.length === 0) return

    // Debounce API call
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchMastery(uncached)
    }, 150)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [candidates, fetchMastery])

  // Merge mastery data onto candidates
  return candidates.map((c) => ({
    ...c,
    mastery: cacheRef.current[c.surface] ?? masteryMap[c.surface] ?? null,
  }))
}
