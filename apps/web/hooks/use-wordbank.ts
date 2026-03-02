'use client'

import { useEffect, useState, useCallback } from 'react'
import type { WordBankEntry, WordBankFilters } from '@lingle/shared/types'
import { api } from '@/lib/api'

export function useWordbank(initialFilters?: WordBankFilters) {
  const [items, setItems] = useState<WordBankEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<WordBankFilters | undefined>(
    initialFilters
  )

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    const result = await api.wordbankList(filters)
    setItems(result)
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const addItem = useCallback(
    async (data: {
      surfaceForm: string
      reading?: string
      meaning: string
      partOfSpeech?: string
      tags?: string[]
    }) => {
      const newItem = await api.wordbankAdd(data)
      setItems((prev) => [newItem, ...prev])
      return newItem
    },
    []
  )

  const search = useCallback(async (query: string) => {
    setIsLoading(true)
    const results = await api.wordbankSearch(query)
    setItems(results)
    setIsLoading(false)
  }, [])

  return { items, isLoading, filters, setFilters, addItem, search, reload: loadItems }
}
