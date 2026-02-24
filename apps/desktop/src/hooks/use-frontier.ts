import { useEffect, useState } from 'react'
import type { FrontierData } from '@shared/types'

export function useFrontier() {
  const [data, setData] = useState<FrontierData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.linguist.dashboardGetFrontier().then((result) => {
      setData(result)
      setIsLoading(false)
    })
  }, [])

  return { data, isLoading }
}
