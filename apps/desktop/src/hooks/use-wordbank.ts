import { useEffect, useState, useCallback } from 'react'
import type { WordBankEntry, WordBankFilters } from '@shared/types'

export function useWordbank(initialFilters?: WordBankFilters) {
  const [items, setItems] = useState<WordBankEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<WordBankFilters | undefined>(
    initialFilters
  )

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    const result = await window.lingle.wordbankList(filters)
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
      const newItem = await window.lingle.wordbankAdd(data)
      setItems((prev) => [newItem, ...prev])
      return newItem
    },
    []
  )

  const search = useCallback(async (query: string) => {
    setIsLoading(true)
    const results = await window.lingle.wordbankSearch(query)
    setItems(results)
    setIsLoading(false)
  }, [])

  return { items, isLoading, filters, setFilters, addItem, search, reload: loadItems }
}
