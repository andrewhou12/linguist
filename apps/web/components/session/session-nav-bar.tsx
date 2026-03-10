'use client'

import {
  StopIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { SessionPlan } from '@/lib/session-plan'

interface SessionNavBarProps {
  plan: SessionPlan | null
  duration: number
  transcriptCount: number
  isPlanOpen: boolean
  isTranscriptOpen: boolean
  isSubtitlesOn: boolean
  onTogglePlan: () => void
  onToggleTranscript: () => void
  onToggleSubtitles: () => void
  onEnd: () => void
  currentSectionLabel?: string
  showSubtitlesToggle?: boolean
  rightSlot?: React.ReactNode
  inputMode?: 'chat' | 'voice'
}

function formatModeLabel(mode: string | undefined, inputMode?: 'chat' | 'voice'): string {
  const prefix = inputMode === 'voice' ? 'Voice' : inputMode === 'chat' ? 'Chat' : ''
  const base = mode || 'session'
  const capitalized = base.charAt(0).toUpperCase() + base.slice(1)
  return prefix ? `${prefix} ${capitalized}` : capitalized
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SegmentBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-medium font-sans cursor-pointer transition-all duration-150',
        active
          ? 'bg-bg-pure text-text-primary shadow-[0_1px_2px_rgba(0,0,0,.06)]'
          : 'bg-transparent text-text-secondary hover:text-text-primary',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

export function SessionNavBar({
  plan,
  duration,
  isPlanOpen,
  isTranscriptOpen,
  isSubtitlesOn,
  onTogglePlan,
  onToggleTranscript,
  onToggleSubtitles,
  onEnd,
  currentSectionLabel,
  showSubtitlesToggle = true,
  rightSlot,
  inputMode,
}: SessionNavBarProps) {
  return (
    <nav className="flex items-center px-5 h-[54px] z-20 relative shrink-0">
      {/* Left -- Mode + timer */}
      <div className="flex-1 flex items-center gap-2.5">
        <span className="px-2.5 py-1 rounded-md bg-bg-secondary text-[12px] font-medium text-text-secondary">
          {formatModeLabel(plan?.mode, inputMode)}
        </span>
        <div className="w-px h-[14px] bg-border shrink-0" />
        <span className="font-sans text-[13px] text-text-secondary tabular-nums">
          {formatDuration(duration)}
        </span>
        {currentSectionLabel && (
          <>
            <div className="w-px h-[14px] bg-border shrink-0" />
            <span className="text-[13px] text-text-secondary truncate max-w-[200px]">
              {currentSectionLabel}
            </span>
          </>
        )}
      </div>

      {/* Center -- Segmented toggle */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 p-[3px] rounded-lg bg-bg-secondary">
        <SegmentBtn
          active={isPlanOpen}
          onClick={onTogglePlan}
          label="Plan"
          icon={<DocumentTextIcon className="w-4 h-4" />}
        />
        <SegmentBtn
          active={isTranscriptOpen}
          onClick={onToggleTranscript}
          label="Transcript"
          icon={<ChatBubbleLeftIcon className="w-4 h-4" />}
        />
        {showSubtitlesToggle && (
          <SegmentBtn
            active={isSubtitlesOn}
            onClick={onToggleSubtitles}
            label="Subtitles"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="6" y1="16" x2="14" y2="16" />
                <line x1="12" y1="12" x2="18" y2="12" />
              </svg>
            }
          />
        )}
      </div>

      {/* Right -- End session + optional slot */}
      <div className="flex-1 flex justify-end items-center gap-2">
        {rightSlot}
        <button
          onClick={onEnd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-bg-secondary border border-border text-[13px] font-medium text-text-secondary cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary hover:border-border-strong"
        >
          <StopIcon className="w-4 h-4" />
          End
        </button>
      </div>
    </nav>
  )
}
