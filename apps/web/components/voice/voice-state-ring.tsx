'use client'

import { cn } from '@/lib/utils'
import type { VoiceState } from '@/hooks/use-voice-conversation'

interface VoiceStateRingProps {
  state: VoiceState
  isTalking: boolean
  /** Size in px — should match the orb canvas size */
  size?: number
  className?: string
}

const R = 60
const C = 2 * Math.PI * R

/**
 * SVG ring overlay that wraps around the central orb.
 * Matches the mockup's state ring behavior:
 * - IDLE: subtle dashed ring, slow spin
 * - LISTENING/user talking: warm-colored ring, nearly complete, pulsing
 * - THINKING: muted dashed ring, medium spin
 * - SPEAKING: brand-colored segmented ring, fast spin
 */
export function VoiceStateRing({ state, isTalking, size = 220, className }: VoiceStateRingProps) {
  const isUser = isTalking || state === 'LISTENING' || state === 'INTERRUPTED'
  const isAI = state === 'SPEAKING'
  const isThinking = state === 'THINKING'
  const isIdle = state === 'IDLE' && !isTalking

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('absolute inset-0 pointer-events-none z-[3]', className)}
    >
      {/* Base ring — always visible */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        fill="none"
        stroke="var(--border)"
        strokeWidth="1.5"
        opacity={isUser ? 0.2 : 0.5}
        className="transition-opacity duration-400"
      />

      {/* IDLE: subtle dashed ring, slow spin */}
      {isIdle && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1.5"
          strokeDasharray={`${C * 0.15} ${C * 0.85}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="animate-[voice-ring-idle-spin_7s_linear_infinite] opacity-40"
        />
      )}

      {/* USER SPEAKING: indigo ring, full circle, pulsing */}
      {isUser && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="var(--ring-user)"
          strokeWidth="2"
          className="animate-[voice-ring-user-pulse_1.4s_ease-in-out_infinite]"
        />
      )}

      {/* THINKING: purple dashed, medium spin */}
      {isThinking && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="var(--ring-thinking)"
          strokeWidth="1.5"
          strokeDasharray={`${C * 0.1} ${C * 0.07}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="animate-[voice-ring-ai-spin_3s_linear_infinite] opacity-70"
        />
      )}

      {/* AI SPEAKING: amber segmented ring, fast spin */}
      {isAI && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="var(--ring-ai)"
          strokeWidth="1.5"
          strokeDasharray={`${C * 0.12} ${C * 0.08}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="animate-[voice-ring-ai-spin_2.2s_linear_infinite] opacity-90"
        />
      )}
    </svg>
  )
}
