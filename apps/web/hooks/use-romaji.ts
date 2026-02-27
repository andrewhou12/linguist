'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'linguist-show-romaji'
const HAS_KANJI = /[\u4e00-\u9faf\u3400-\u4dbf]/
const HAS_ANNOTATION = /\{[^}|]+\|[^}]+\}/

// Module-level cache shared across all hook instances
const annotationCache = new Map<string, string>()

// Batch queue: accumulate texts that need annotation, flush in one API call
let batchQueue: Array<{ text: string; resolve: (annotated: string) => void }> = []
let batchTimer: ReturnType<typeof setTimeout> | null = null

function flushBatch() {
  if (batchQueue.length === 0) return
  const batch = batchQueue.splice(0)
  const texts = batch.map((b) => b.text)

  fetch('/api/annotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  })
    .then((r) => r.json())
    .then(({ annotated }: { annotated: string[] }) => {
      batch.forEach((b, i) => {
        const result = annotated[i] ?? b.text
        annotationCache.set(b.text, result)
        b.resolve(result)
      })
    })
    .catch(() => {
      batch.forEach((b) => b.resolve(b.text))
    })
}

function requestAnnotation(text: string): Promise<string> {
  const cached = annotationCache.get(text)
  if (cached) return Promise.resolve(cached)

  return new Promise<string>((resolve) => {
    batchQueue.push({ text, resolve })
    if (batchTimer) clearTimeout(batchTimer)
    batchTimer = setTimeout(flushBatch, 50)
  })
}

/**
 * Returns whether a text needs server-side annotation
 * (contains kanji but no existing {漢字|かんじ} annotations).
 */
function needsAnnotation(text: string): boolean {
  return HAS_KANJI.test(text) && !HAS_ANNOTATION.test(text)
}

export function useRomaji() {
  const [showRomaji, setShowRomaji] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setShowRomaji(true)
  }, [])

  const toggle = useCallback(() => {
    setShowRomaji((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return { showRomaji, toggle }
}

/**
 * Hook to get annotated versions of message texts.
 * When showRomaji is true, texts with unannotated kanji are sent to the server
 * for annotation. Results are cached module-wide.
 */
export function useAnnotatedTexts(texts: string[], showRomaji: boolean) {
  const [annotated, setAnnotated] = useState<Map<string, string>>(new Map())
  const pendingRef = useRef(new Set<string>())

  useEffect(() => {
    if (!showRomaji) return

    const toFetch = texts.filter(
      (t) => needsAnnotation(t) && !annotationCache.has(t) && !pendingRef.current.has(t)
    )

    if (toFetch.length === 0) {
      // All cached — sync state
      const next = new Map<string, string>()
      for (const t of texts) {
        const cached = annotationCache.get(t)
        if (cached) next.set(t, cached)
      }
      if (next.size > 0) setAnnotated(next)
      return
    }

    for (const t of toFetch) pendingRef.current.add(t)

    Promise.all(toFetch.map(requestAnnotation)).then(() => {
      for (const t of toFetch) pendingRef.current.delete(t)
      const next = new Map<string, string>()
      for (const t of texts) {
        const cached = annotationCache.get(t)
        if (cached) next.set(t, cached)
      }
      setAnnotated(next)
    })
  }, [texts, showRomaji])

  const getAnnotated = useCallback(
    (text: string): string => {
      if (!showRomaji) return text
      return annotated.get(text) ?? annotationCache.get(text) ?? text
    },
    [showRomaji, annotated]
  )

  return { getAnnotated }
}
