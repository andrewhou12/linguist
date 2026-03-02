'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import type { XRayToken } from '@/components/chat/sentence-xray'

interface SelectionXRayState {
  containerRef: React.RefObject<HTMLDivElement | null>
  selectedText: string | null
  selectionRect: DOMRect | null
  isOpen: boolean
  isLoading: boolean
  tokens: XRayToken[] | null
  error: string | null
  trigger: () => void
  dismiss: () => void
}

export function useSelectionXRay(): SelectionXRayState {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState<XRayToken[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cache = useRef<Map<string, XRayToken[]>>(new Map())

  const dismiss = useCallback(() => {
    setIsOpen(false)
    setIsLoading(false)
    setTokens(null)
    setError(null)
    setSelectedText(null)
    setSelectionRect(null)
  }, [])

  const trigger = useCallback(async () => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (!text || !containerRef.current) return

    // Check selection is within container
    if (!sel?.rangeCount) return
    const range = sel.getRangeAt(0)
    if (!containerRef.current.contains(range.commonAncestorContainer)) return

    const rect = range.getBoundingClientRect()
    setSelectedText(text)
    setSelectionRect(rect)
    setIsOpen(true)
    setError(null)

    // Check cache
    const cached = cache.current.get(text)
    if (cached) {
      setTokens(cached)
      return
    }

    setIsLoading(true)
    setTokens(null)
    try {
      const result = await api.conversationXray(text)
      cache.current.set(text, result.tokens)
      setTokens(result.tokens)
    } catch {
      setError('Failed to analyze selection')
    }
    setIsLoading(false)
  }, [])

  // Detect text selection on mouseup
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = () => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()

      if (!text || !sel?.rangeCount) {
        // Don't dismiss if popover is open (user might click inside it)
        if (!isOpen) {
          setSelectedText(null)
          setSelectionRect(null)
        }
        return
      }

      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) return

      const rect = range.getBoundingClientRect()
      // If popover is open, dismiss it for a new selection
      if (isOpen) dismiss()
      setSelectedText(text)
      setSelectionRect(rect)
    }

    container.addEventListener('mouseup', handleMouseUp)
    return () => container.removeEventListener('mouseup', handleMouseUp)
  }, [isOpen, dismiss])

  // Hotkey: Cmd+E / Ctrl+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen) {
          dismiss()
        } else {
          trigger()
        }
      }
      if (e.key === 'Escape' && isOpen) {
        dismiss()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, trigger, dismiss])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Don't close if clicking on the popover itself
      if (target.closest('[data-selection-xray]')) return
      dismiss()
    }

    // Use a timeout to avoid closing immediately from the same click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, dismiss])

  return {
    containerRef,
    selectedText,
    selectionRect,
    isOpen,
    isLoading,
    tokens,
    error,
    trigger,
    dismiss,
  }
}
