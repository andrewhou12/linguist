'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

type GrammarEntry = Awaited<ReturnType<typeof api.grammarList>>[number]

export function useGrammar(initialFilters?: { masteryState?: string }) {
  const [items, setItems] = useState<GrammarEntry[]>(() => api.peekCache<GrammarEntry[]>('/grammar') ?? [])
  const [isLoading, setIsLoading] = useState(() => !api.peekCache('/grammar'))
  const [filters, setFilters] = useState(initialFilters)
  const skipLoadingRef = useRef(!!api.peekCache('/grammar'))

  const loadItems = useCallback(async () => {
    if (!skipLoadingRef.current) setIsLoading(true)
    skipLoadingRef.current = false
    try {
      const result = await api.grammarList(filters)
      setItems(result)
    } catch (err) {
      console.error('Failed to load grammar items:', err)
    }
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const search = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      const result = await api.grammarList({ ...filters, search: query })
      setItems(result)
    } catch (err) {
      console.error('Failed to search grammar items:', err)
    }
    setIsLoading(false)
  }, [filters])

  return { items, isLoading, filters, setFilters, search, reload: loadItems }
}
