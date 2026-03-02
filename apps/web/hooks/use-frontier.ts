'use client'

import { useEffect, useState } from 'react'
import type { FrontierData } from '@lingle/shared/types'
import { api } from '@/lib/api'

export function useFrontier() {
  const [data, setData] = useState<FrontierData | null>(() => api.peekCache<FrontierData | null>('/dashboard/frontier') ?? null)
  const [isLoading, setIsLoading] = useState(() => api.peekCache('/dashboard/frontier') === undefined)

  useEffect(() => {
    api.dashboardGetFrontier().then((result) => {
      setData(result)
      setIsLoading(false)
    })
  }, [])

  return { data, isLoading }
}
