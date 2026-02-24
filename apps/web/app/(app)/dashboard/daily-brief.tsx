'use client'

import { useEffect, useState } from 'react'
import { Box, Card, Flex, Text } from '@radix-ui/themes'
import type { FrontierData, TomBrief } from '@linguist/shared/types'
import { api } from '@/lib/api'

function getCacheKey(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `daily-brief-${today}`
}

export function DailyBrief({ frontier }: { frontier: FrontierData }) {
  const [text, setText] = useState<string>('')
  const [isPolished, setIsPolished] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      let brief: TomBrief | null = null
      try {
        brief = await api.tomGetBrief()
      } catch {
        // ToM brief unavailable
      }

      const draft = await api.narrativeBuildDraft(frontier, brief)
      if (cancelled) return

      setText(draft.templateText)

      const cacheKey = getCacheKey()
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setText(cached)
        setIsPolished(true)
        return
      }

      try {
        const polished = await api.narrativePolish(draft)
        if (cancelled) return
        if (polished && polished !== draft.templateText) {
          setText(polished)
          setIsPolished(true)
          localStorage.setItem(cacheKey, polished)
        }
      } catch {
        // API unavailable
      }
    }

    load()
    return () => { cancelled = true }
  }, [frontier])

  if (!text) return null

  return (
    <Card
      mt="5"
      style={{
        borderLeft: '3px solid var(--accent-9)',
        background: 'var(--color-surface)',
      }}
    >
      <Flex direction="column" gap="2">
        <Text size="1" color="gray" weight="medium">
          {isPolished ? 'AI summary' : 'Summary'}
        </Text>
        <Box>
          <Text
            size="2"
            style={{ fontStyle: isPolished ? 'italic' : 'normal', lineHeight: 1.6 }}
          >
            {text}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
