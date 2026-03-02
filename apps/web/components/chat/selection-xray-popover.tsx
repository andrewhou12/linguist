'use client'

import { createPortal } from 'react-dom'
import { Scan, Loader2, X } from 'lucide-react'
import { XRayTokenGrid } from '@/components/chat/sentence-xray'
import type { XRayToken } from '@/components/chat/sentence-xray'

interface SelectionXRayPopoverProps {
  selectedText: string | null
  selectionRect: DOMRect | null
  isOpen: boolean
  isLoading: boolean
  tokens: XRayToken[] | null
  error: string | null
  onTrigger: () => void
  onDismiss: () => void
}

function TriggerButton({
  rect,
  onTrigger,
}: {
  rect: DOMRect
  onTrigger: () => void
}) {
  // Position above the selection, centered
  const top = rect.top - 36
  const left = rect.left + rect.width / 2

  return (
    <button
      data-selection-xray
      onMouseDown={(e) => {
        e.preventDefault() // Prevent clearing selection
        onTrigger()
      }}
      className="fixed z-[9999] inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-pure border border-border shadow-[var(--shadow-md)] text-[11px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary -translate-x-1/2"
      style={{
        top: `${Math.max(8, top)}px`,
        left: `${left}px`,
      }}
    >
      <Scan size={11} />
      X-Ray
      <kbd className="ml-0.5 text-[9px] text-text-muted font-mono">⌘E</kbd>
    </button>
  )
}

function ResultsPopover({
  rect,
  selectedText,
  isLoading,
  tokens,
  error,
  onDismiss,
}: {
  rect: DOMRect
  selectedText: string
  isLoading: boolean
  tokens: XRayToken[] | null
  error: string | null
  onDismiss: () => void
}) {
  const popoverWidth = 400
  // Position below selection if room, above if not
  const spaceBelow = window.innerHeight - rect.bottom
  const above = spaceBelow < 200
  const top = above ? rect.top - 8 : rect.bottom + 8
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - popoverWidth - 8))

  return (
    <div
      data-selection-xray
      className="fixed z-[9999] bg-bg-pure border border-border rounded-xl shadow-[var(--shadow-lg)] overflow-hidden"
      style={{
        top: above ? undefined : `${top}px`,
        bottom: above ? `${window.innerHeight - top}px` : undefined,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        maxHeight: '300px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
        <span className="text-[12px] font-medium text-text-secondary truncate mr-2" title={selectedText}>
          {selectedText.length > 40 ? selectedText.slice(0, 40) + '...' : selectedText}
        </span>
        <button
          onClick={onDismiss}
          className="p-0.5 rounded text-text-muted hover:text-text-primary border-none bg-transparent cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 overflow-auto" style={{ maxHeight: '250px' }}>
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 size={14} className="animate-spin text-text-muted" />
            <span className="text-[12px] text-text-muted">Analyzing...</span>
          </div>
        )}

        {error && (
          <span className="text-[12px] text-accent-warm">{error}</span>
        )}

        {tokens && <XRayTokenGrid tokens={tokens} />}
      </div>
    </div>
  )
}

export function SelectionXRayPopover({
  selectedText,
  selectionRect,
  isOpen,
  isLoading,
  tokens,
  error,
  onTrigger,
  onDismiss,
}: SelectionXRayPopoverProps) {
  if (typeof window === 'undefined') return null

  // Show trigger button when text is selected but popover is not open
  const showTrigger = selectedText && selectionRect && !isOpen

  // Show results when popover is open
  const showResults = isOpen && selectionRect && selectedText

  if (!showTrigger && !showResults) return null

  return createPortal(
    <>
      {showTrigger && (
        <TriggerButton rect={selectionRect} onTrigger={onTrigger} />
      )}
      {showResults && (
        <ResultsPopover
          rect={selectionRect}
          selectedText={selectedText}
          isLoading={isLoading}
          tokens={tokens}
          error={error}
          onDismiss={onDismiss}
        />
      )}
    </>,
    document.body
  )
}
