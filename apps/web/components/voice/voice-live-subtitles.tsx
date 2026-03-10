'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { stripRubyAnnotations } from '@/lib/ruby-annotator'
import type { TranscriptLine } from '@/hooks/use-voice-conversation'

interface CorrectionInfo {
  original: string
  corrected: string
  explanation: string
  grammarPoint?: string
}

interface CorrectionSegment {
  text: string
  error: boolean
  correction?: string
  note?: string
}

interface VoiceLiveSubtitlesProps {
  /** The user's live partial text (streaming from STT) */
  partialText: string
  /** The finalized user transcript line for this exchange */
  userLine: TranscriptLine | null
  /** The AI transcript line for this exchange */
  aiLine: TranscriptLine | null
  /** Latest correction for the user's turn */
  correction: CorrectionInfo | null
  /** Whether subtitles are toggled on */
  visible: boolean
  /** Current voice state for phase logic */
  voiceState: string
  /** Whether user is actively holding PTT */
  isTalking: boolean
  className?: string
}

function parseSegments(text: string, corrections: CorrectionInfo[]): CorrectionSegment[] {
  const segs: CorrectionSegment[] = []
  let remaining = text

  const sorted = [...corrections].sort(
    (a, b) => text.indexOf(a.original) - text.indexOf(b.original),
  )

  for (const c of sorted) {
    const i = remaining.indexOf(c.original)
    if (i === -1) continue
    if (i > 0) segs.push({ text: remaining.slice(0, i), error: false })
    segs.push({
      text: c.original,
      error: true,
      correction: c.corrected,
      note: c.explanation,
    })
    remaining = remaining.slice(i + c.original.length)
  }
  if (remaining) segs.push({ text: remaining, error: false })
  return segs
}

export function VoiceLiveSubtitles({
  partialText,
  userLine,
  aiLine,
  correction,
  visible,
  voiceState,
  isTalking,
  className,
}: VoiceLiveSubtitlesProps) {
  const hasCorrection = !!correction

  // User text: partial (live) while talking, finalized line otherwise
  const userText = isTalking || partialText ? partialText : (userLine?.text || '')

  const cleanAiText = useMemo(
    () => (aiLine ? stripRubyAnnotations(aiLine.text) : ''),
    [aiLine],
  )

  const segments = useMemo(() => {
    if (!correction || !userLine) return []
    return parseSegments(userLine.text, [correction])
  }, [correction, userLine])

  // Determine what to show
  const showUser = !!userText
  const showAI = !!cleanAiText

  // Generate a key that changes per exchange (clears animation state)
  const exchangeKey = userLine?.timestamp || 'none'

  return (
    <div
      className={cn(
        'w-full max-w-[460px] mx-auto text-center min-h-[80px] flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {/* User text */}
      <AnimatePresence mode="popLayout">
        {showUser && (
          <motion.div
            key={`user-${exchangeKey}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-[15px] leading-[1.8] text-text-primary font-jp-clean"
          >
            {hasCorrection && segments.length > 0
              ? segments.map((s, i) => (
                  <span
                    key={i}
                    className={cn(
                      'relative inline',
                      s.error && 'bg-warm-soft border-b-2 border-accent-warm rounded-sm pb-px',
                    )}
                  >
                    {s.text}
                    {s.error && s.correction && (
                      <span className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-accent-brand text-white text-[10px] px-2 py-[3px] rounded-md whitespace-nowrap font-medium font-sans animate-[voice-fade-up_0.2s_ease_both]">
                        &rarr; {s.correction}
                      </span>
                    )}
                  </span>
                ))
              : <span>{userText}</span>
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI text — shown underneath with visual separation */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            key={`ai-${exchangeKey}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-5 h-px bg-border-strong mb-0.5" />
            <div className="text-[14.5px] leading-[1.7] text-text-secondary font-jp-clean italic">
              {cleanAiText}
              {aiLine && !aiLine.isFinal && (
                <span className="inline-block w-[2px] h-[0.88em] bg-text-secondary ml-px animate-[blink-cursor_0.65s_step-end_infinite] align-text-bottom" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
