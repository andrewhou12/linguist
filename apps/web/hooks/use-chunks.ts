'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { WordBankChunkEntry } from '@lingle/shared/types'
import { api } from '@/lib/api'

export function useChunks(initialFilters?: { masteryState?: string; itemKind?: string }) {
  const [items, setItems] = useState<WordBankChunkEntry[]>(() => api.peekCache<WordBankChunkEntry[]>('/chunks') ?? [])
  const [isLoading, setIsLoading] = useState(() => !api.peekCache('/chunks'))
  const [filters, setFilters] = useState(initialFilters)
  const skipLoadingRef = useRef(!!api.peekCache('/chunks'))

  const loadItems = useCallback(async () => {
    if (!skipLoadingRef.current) setIsLoading(true)
    skipLoadingRef.current = false
    try {
      const result = await api.chunksList(filters)
      setItems(result)
    } catch (err) {
      console.error('Failed to load chunk items:', err)
    }
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const search = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      const result = await api.chunksList({ ...filters, search: query })
      setItems(result)
    } catch (err) {
      console.error('Failed to search chunk items:', err)
    }
    setIsLoading(false)
  }, [filters])

  return { items, isLoading, filters, setFilters, search, reload: loadItems }
}
