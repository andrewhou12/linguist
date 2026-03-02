'use client'

import { useEffect, useState } from 'react'
import type { FrontierData } from '@lingle/shared/types'
import { api } from '@/lib/api'

export function useFrontier() {
  const [data, setData] = useState<FrontierData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.dashboardGetFrontier().then((result) => {
      setData(result)
      setIsLoading(false)
    })
  }, [])

  return { data, isLoading }
}
