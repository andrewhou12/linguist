'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { VoiceProvider } from '@humeai/voice-react'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useVoiceConversation, type UseVoiceConversationReturn } from '@/hooks/use-voice-conversation'
import { useHumeVoice } from '@/hooks/use-hume-voice'
import { getVoiceToolZone } from '@/lib/voice/voice-tool-zones'
import type { SessionPlan } from '@/lib/session-plan'
import type { VoiceProviderType } from '@/lib/voice/voice-provider-config'
import { VoiceCentralOrb } from './voice-central-orb'
import { VoiceStateRing } from './voice-state-ring'
import { VoiceNavBar } from './voice-nav-bar'
import { VoiceSessionPlanSidebar } from './voice-session-plan-sidebar'
import { VoiceLiveSubtitles } from './voice-live-subtitles'
import { VoiceTranscriptPanel } from './voice-transcript-panel'
import { VoiceCorrectionsPanel } from './voice-corrections-panel'
import { VoiceCornerPanel } from './voice-corner-panel'
import { VoiceControls, type ActivePanel } from './voice-controls'
import { VoiceFallbackInput } from './voice-fallback-input'
import { ToolToastContainer } from './tool-toast'
import { ToolTray } from './tool-tray'
import { CorrectionCard } from '@/components/chat/correction-card'
import { VocabularyCard } from '@/components/chat/vocabulary-card'
import { GrammarNote } from '@/components/chat/grammar-note'
import { Spinner } from '@/components/spinner'
import { cn } from '@/lib/utils'

interface VoiceSessionOverlayProps {
  prompt: string
  mode: string
  sessionId?: string | null
  plan?: SessionPlan | null
  steeringNotes?: string[]
  voiceProvider?: VoiceProviderType
  onEnd: () => void
}

export function VoiceSessionOverlay(props: VoiceSessionOverlayProps) {
  const { voiceProvider = 'soniox' } = props

  if (voiceProvider === 'hume') {
    return (
      <VoiceProvider
        onError={(err) => console.error('[hume-provider] error:', JSON.stringify(err, null, 2), err)}
        onOpen={() => console.log('[hume-provider] connected')}
        onClose={(ev) => console.log('[hume-provider] closed:', ev)}
      >
        <HumeSessionContent {...props} />
      </VoiceProvider>
    )
  }

  return <SonioxSessionContent {...props} />
}

/** Soniox pathway */
function SonioxSessionContent(props: VoiceSessionOverlayProps) {
  const { prompt, mode, sessionId: existingSessionId, plan: existingPlan, steeringNotes, onEnd } = props

  const voice = useVoiceConversation({
    sessionId: existingSessionId,
    autoEndpoint: false,
  })

  return (
    <SessionOverlayInner
      voice={voice}
      prompt={prompt}
      mode={mode}
      existingSessionId={existingSessionId}
      existingPlan={existingPlan}
      steeringNotes={steeringNotes}
      voiceProvider="soniox"
      onEnd={onEnd}
    />
  )
}

/** Hume pathway */
function HumeSessionContent(props: VoiceSessionOverlayProps) {
  const { prompt, mode, sessionId: existingSessionId, plan: existingPlan, steeringNotes, onEnd } = props

  const voice = useHumeVoice({
    sessionId: existingSessionId,
    sessionPlan: existingPlan,
  })

  return (
    <SessionOverlayInner
      voice={voice}
      prompt={prompt}
      mode={mode}
      existingSessionId={existingSessionId}
      existingPlan={existingPlan}
      steeringNotes={steeringNotes}
      voiceProvider="hume"
      onEnd={onEnd}
    />
  )
}

/** Shared session overlay — provider-agnostic, mockup-aligned layout */
function SessionOverlayInner({
  voice,
  prompt,
  mode,
  existingSessionId,
  existingPlan,
  steeringNotes,
  voiceProvider,
  onEnd,
}: {
  voice: UseVoiceConversationReturn
  prompt: string
  mode: string
  existingSessionId?: string | null
  existingPlan?: SessionPlan | null
  steeringNotes?: string[]
  voiceProvider: VoiceProviderType
  onEnd: () => void
}) {
  // ── Panel state ──
  const [isStarting, setIsStarting] = useState(true)
  const [planOpen, setPlanOpen] = useState(false)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [correctionsOpen, setCorrectionsOpen] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(new Set())

  // ── Hint panel state ──
  const [hintMessages, setHintMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    { role: 'ai', text: 'Need help? Describe what you\'re trying to say and I\'ll guide you.' },
  ])
  const [hintInput, setHintInput] = useState('')

  // ── Steering ──
  const [steeringMessages, setSteeringMessages] = useState<Array<{ text: string; time: string }>>(
    steeringNotes?.map(text => ({ text, time: '0:00' })) || [],
  )

  const startedRef = useRef(false)

  // Start session on mount
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const init = async () => {
      try {
        if (existingPlan && existingSessionId) {
          await voice.startWithExistingPlan(existingSessionId, existingPlan, prompt, steeringNotes)
        } else if (existingSessionId) {
          await voice.startSession()
        } else {
          await voice.startNewSession(prompt, mode)
        }
      } catch (err) {
        console.error('Failed to start voice session:', err)
      }
      setIsStarting(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Format duration
  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  // Steering handler
  const handleSteer = useCallback((text: string) => {
    setSteeringMessages(prev => [...prev, { text, time: formatTime(voice.duration) }])
    voice.sendTextMessage(`[Learner instruction: ${text}]`)
  }, [voice.duration, voice.sendTextMessage, formatTime])

  // ── Corrections list (aggregated from all analysis results) ──
  const allCorrections = useMemo(() => {
    const corrections: Array<{ original: string; corrected: string; explanation: string; grammarPoint?: string }> = []
    for (const result of Object.values(voice.analysisResults)) {
      for (const c of result.corrections) {
        corrections.push({
          original: c.original,
          corrected: c.corrected,
          explanation: c.explanation,
          grammarPoint: c.grammarPoint,
        })
      }
    }
    // Also check message tool-call parts
    for (const msg of voice.messages) {
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts) {
        const partType = (part as { type: string }).type
        if (partType !== 'tool-showCorrection') continue
        const toolPart = part as { type: string; state: string; output?: unknown }
        if (toolPart.state === 'output-available' && toolPart.output) {
          const o = toolPart.output as Record<string, string>
          if (!corrections.some(c => c.original === o.original && c.corrected === o.corrected)) {
            corrections.push({
              original: o.original,
              corrected: o.corrected,
              explanation: o.explanation,
              grammarPoint: o.grammarPoint,
            })
          }
        }
      }
    }
    return corrections
  }, [voice.analysisResults, voice.messages])

  // Latest correction for subtitles
  const latestCorrection = useMemo(() => {
    if (allCorrections.length === 0) return null
    return allCorrections[allCorrections.length - 1]
  }, [allCorrections])

  // ── Tool outputs for toasts ──
  const toolOutputs = useMemo(() => {
    const outputs: Array<{ id: string; toolName: string; output: Record<string, unknown> }> = []

    for (const msg of voice.messages) {
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts) {
        const partType = (part as { type: string }).type
        if (!partType.startsWith('tool-')) continue
        const toolName = partType.replace('tool-', '')
        const zone = getVoiceToolZone(toolName)
        if (zone !== 'toast') continue
        const toolPart = part as { type: string; state: string; output?: unknown }
        if (toolPart.state === 'output-available' && toolPart.output) {
          const id = `${msg.id}-${toolName}-${outputs.length}`
          outputs.push({ id, toolName, output: toolPart.output as Record<string, unknown> })
        }
      }
    }

    for (const [turnIdx, result] of Object.entries(voice.analysisResults)) {
      for (const correction of result.corrections) {
        const id = `analysis-${turnIdx}-correction-${correction.original}`
        outputs.push({ id, toolName: 'showCorrection', output: correction as unknown as Record<string, unknown> })
      }
      for (const card of result.vocabularyCards) {
        const id = `analysis-${turnIdx}-vocab-${card.word}`
        outputs.push({ id, toolName: 'showVocabularyCard', output: card as unknown as Record<string, unknown> })
      }
      for (const note of result.grammarNotes) {
        const id = `analysis-${turnIdx}-grammar-${note.pattern}`
        outputs.push({ id, toolName: 'showGrammarNote', output: note as unknown as Record<string, unknown> })
      }
    }

    return outputs
  }, [voice.messages, voice.analysisResults])

  // Toast management
  const openCorrectionsPanel = useCallback(() => {
    setCorrectionsOpen(true)
    setTranscriptOpen(false)
  }, [])

  const activeToasts = useMemo(
    () => toolOutputs
      .filter(t => !dismissedToasts.has(t.id))
      .slice(-3)
      .map(t => {
        const isCorrection = t.toolName === 'showCorrection'
        return {
          id: t.id,
          content: renderToolCard(t.toolName, t.output),
          duration: isCorrection ? 0 : 8000,
          onClick: isCorrection ? openCorrectionsPanel : undefined,
        }
      }),
    [toolOutputs, dismissedToasts, openCorrectionsPanel],
  )

  const trayItems = useMemo(
    () => toolOutputs.map(t => ({ id: t.id, content: renderToolCard(t.toolName, t.output) })),
    [toolOutputs],
  )

  const handleDismissToast = useCallback((id: string) => {
    setDismissedToasts(prev => new Set(prev).add(id))
  }, [])

  // ── Hint panel handlers ──
  const handleHintSend = useCallback(() => {
    if (!hintInput.trim()) return
    const userMsg = { role: 'user' as const, text: hintInput.trim() }
    setHintMessages(m => [...m, userMsg])
    const inputText = hintInput.trim()
    setHintInput('')
    // TODO: Wire to actual hint API when available
    setTimeout(() => {
      setHintMessages(m => [...m, {
        role: 'ai',
        text: `Try saying: 「${inputText}」— let me suggest a pattern for you. Use 〜について話したい if you want to express "I want to talk about ~".`,
      }])
    }, 800)
  }, [hintInput])

  // ── End session ──
  const endingRef = useRef(false)
  const handleEnd = useCallback(async () => {
    if (endingRef.current) return
    endingRef.current = true
    try { await voice.endSession() } catch {}
    onEnd()
  }, [voice.endSession, onEnd])

  // Escape exits (but not while talking)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showKeyboard && !voice.isTalking) handleEnd()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleEnd, showKeyboard, voice.isTalking])

  // Cleanup
  useEffect(() => {
    return () => {
      if (voice.isActive) voice.endSession().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Current exchange tracking ──
  // Tracks the user line + AI line for the current turn pair.
  // Clears when the user starts a new turn.
  const [exchangeUserLine, setExchangeUserLine] = useState<typeof voice.transcript[0] | null>(null)
  const [exchangeAILine, setExchangeAILine] = useState<typeof voice.transcript[0] | null>(null)
  const prevTranscriptLenRef = useRef(0)

  // When user starts talking, clear the exchange
  const hasPartial = !!voice.partialText
  useEffect(() => {
    if (voice.isTalking || hasPartial) {
      setExchangeUserLine(null)
      setExchangeAILine(null)
    }
  }, [voice.isTalking, hasPartial])

  // When new transcript lines appear, update the exchange
  useEffect(() => {
    const len = voice.transcript.length
    if (len > prevTranscriptLenRef.current) {
      for (let i = prevTranscriptLenRef.current; i < len; i++) {
        const line = voice.transcript[i]
        if (line.role === 'user') {
          setExchangeUserLine(line)
          setExchangeAILine(null) // new user line clears old AI line
        } else if (line.role === 'assistant') {
          setExchangeAILine(line)
        }
      }
    }
    // Also update existing lines if text changed (streaming updates)
    if (len > 0) {
      const lastLine = voice.transcript[len - 1]
      if (lastLine.role === 'assistant') {
        setExchangeAILine(prev => prev && prev.timestamp === lastLine.timestamp ? lastLine : prev ?? lastLine)
      } else if (lastLine.role === 'user') {
        setExchangeUserLine(prev => prev && prev.timestamp === lastLine.timestamp ? lastLine : prev ?? lastLine)
      }
    }
    prevTranscriptLenRef.current = len
  }, [voice.transcript])

  const transcriptEntries = useMemo(() => {
    return voice.transcript.map((line, i) => ({
      ...line,
      correction: line.role === 'user' && i === voice.transcript.length - 1 ? latestCorrection : null,
      formattedTime: formatTime(Math.floor((line.timestamp - (voice.transcript[0]?.timestamp || line.timestamp)) / 1000)),
    }))
  }, [voice.transcript, latestCorrection, formatTime])

  // Close active panel when user starts talking
  useEffect(() => {
    if (voice.isTalking) setActivePanel(null)
  }, [voice.isTalking])

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-bg">
      {/* Session Plan sidebar (left) */}
      <VoiceSessionPlanSidebar
        isOpen={planOpen}
        plan={voice.sessionPlan || existingPlan || null}
        onCollapse={() => setPlanOpen(false)}
        onSteer={handleSteer}
        steeringMessages={steeringMessages}
      />

      {/* Main layout */}
      <div
        className={cn(
          'relative z-[1] h-screen flex flex-col transition-[padding-left,padding-right] duration-[380ms] ease-[cubic-bezier(.76,0,.24,1)]',
          planOpen ? 'pl-[290px]' : 'pl-0',
          (transcriptOpen || correctionsOpen) ? 'pr-[308px]' : 'pr-0',
        )}
      >
        {/* Nav bar */}
        <VoiceNavBar
          plan={voice.sessionPlan}
          duration={voice.duration}
          transcriptCount={voice.transcript.length}
          isPlanOpen={planOpen}
          isTranscriptOpen={transcriptOpen}
          isSubtitlesOn={showSubtitles}
          voiceProvider={voiceProvider}
          onTogglePlan={() => setPlanOpen(p => !p)}
          onToggleTranscript={() => {
            setTranscriptOpen(p => !p)
            setCorrectionsOpen(false)
          }}
          onToggleSubtitles={() => setShowSubtitles(p => !p)}
          onEnd={handleEnd}
        />

        {/* Main stage */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden relative">
          {/* Starting overlay */}
          {isStarting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-bg/80">
              <VoiceCentralOrb state="IDLE" />
              <div className="flex items-center gap-2.5">
                <Spinner size={16} />
                <span className="text-[13px] text-text-muted">Starting voice session...</span>
              </div>
            </div>
          )}

          {/* Character info */}
          {!isStarting && voice.sessionPlan && 'persona' in voice.sessionPlan && voice.sessionPlan.persona?.name && (
            <div className="text-center mb-1 animate-[voice-fade-up_0.5s_ease_both]">
              <div className="text-[13px] font-medium text-text-primary tracking-[-0.01em]">
                {voice.sessionPlan.persona.name}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {voice.sessionPlan.persona.relationship}
              </div>
            </div>
          )}

          {/* Orb + state ring */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative">
              <VoiceCentralOrb state={voice.voiceState} />
              <VoiceStateRing state={voice.voiceState} isTalking={voice.isTalking} />
            </div>

            {/* Status text */}
            <div className="flex items-center gap-1.5 mt-1 text-[12px] transition-colors">
              <div className={cn(
                'w-[5px] h-[5px] rounded-full transition-colors shrink-0',
                voice.voiceState === 'LISTENING' || voice.voiceState === 'INTERRUPTED'
                  ? 'bg-ring-user animate-[voice-dot-pulse_.7s_ease-in-out_infinite]'
                  : voice.voiceState === 'SPEAKING'
                    ? 'bg-ring-ai animate-[voice-dot-pulse_1.1s_ease-in-out_infinite]'
                    : voice.voiceState === 'THINKING'
                      ? 'bg-ring-thinking animate-[voice-dot-pulse_.55s_ease-in-out_infinite]'
                      : 'bg-text-muted animate-[voice-dot-pulse_2s_ease-in-out_infinite]',
              )} />
              <span className={cn(
                'text-text-muted',
                voice.voiceState === 'LISTENING' && 'text-ring-user',
                voice.voiceState === 'THINKING' && 'text-ring-thinking',
                voice.voiceState === 'SPEAKING' && 'text-ring-ai',
              )}>
                {voice.voiceState === 'IDLE' && 'Hold to speak'}
                {voice.voiceState === 'LISTENING' && 'Listening...'}
                {voice.voiceState === 'THINKING' && 'Thinking...'}
                {voice.voiceState === 'SPEAKING' && 'Speaking...'}
                {voice.voiceState === 'INTERRUPTED' && 'Listening...'}
              </span>
            </div>
          </div>

          {/* Live subtitles */}
          <div className="mt-4">
            <VoiceLiveSubtitles
              partialText=""
              userLine={exchangeUserLine}
              aiLine={exchangeAILine}
              correction={latestCorrection}
              visible={showSubtitles}
              voiceState={voice.voiceState}
              isTalking={voice.isTalking}
            />
          </div>

          {/* ── Corner panels ── */}

          {/* Hint panel */}
          <VoiceCornerPanel
            isOpen={activePanel === 'hint'}
            title="Hint"
            onClose={() => setActivePanel(null)}
          >
            <div className="flex flex-col h-[300px]">
              <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
                {hintMessages.map((m, i) => (
                  <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[85%] px-3.5 py-2 text-[13px] leading-[1.6]',
                      m.role === 'user'
                        ? 'bg-accent-brand text-white rounded-[12px_12px_4px_12px]'
                        : 'bg-bg-secondary border border-border text-text-primary rounded-[12px_12px_12px_4px]',
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2.5 border-t border-border flex gap-[7px]">
                <input
                  value={hintInput}
                  onChange={e => setHintInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleHintSend()}
                  placeholder="I'm trying to say..."
                  className="flex-1 border border-border rounded-lg px-[10px] py-[7px] text-[13px] text-text-primary bg-bg-pure outline-none focus:border-border-strong focus:shadow-[0_0_0_2px_rgba(47,47,47,.08)] font-sans transition-shadow"
                />
                <button
                  onClick={handleHintSend}
                  disabled={!hintInput.trim()}
                  className="w-[34px] h-[34px] rounded-[10px] border-none bg-accent-brand flex items-center justify-center cursor-pointer text-white transition-all hover:bg-[#111] disabled:opacity-30 disabled:pointer-events-none shrink-0"
                >
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </VoiceCornerPanel>

          {/* Lookup panel */}
          <VoiceCornerPanel
            isOpen={activePanel === 'lookup'}
            title="Look up"
            onClose={() => setActivePanel(null)}
          >
            <div className="px-3.5 py-4 text-[13px] text-text-muted text-center">
              Tap a word in the subtitles to look it up here.
            </div>
          </VoiceCornerPanel>
        </main>

        {/* Voice controls */}
        <VoiceControls
          voiceState={voice.voiceState}
          isTalking={voice.isTalking}
          onTalkStart={voice.startTalking}
          onTalkEnd={voice.stopTalking}
          onTalkCancel={voice.cancelTalking}
          correctionsCount={allCorrections.length}
          activePanel={correctionsOpen ? 'corrections' : activePanel}
          onTogglePanel={(panel) => {
            if (panel === 'corrections') {
              setCorrectionsOpen(true)
              setTranscriptOpen(false)
              setActivePanel(null)
            } else if (panel === null && correctionsOpen) {
              setCorrectionsOpen(false)
            } else {
              setCorrectionsOpen(false)
              setActivePanel(panel)
            }
          }}
        />
      </div>

      {/* Transcript panel (right slide) */}
      <VoiceTranscriptPanel
        isOpen={transcriptOpen}
        entries={transcriptEntries}
        onClose={() => setTranscriptOpen(false)}
      />

      {/* Corrections panel (right slide) */}
      <VoiceCorrectionsPanel
        isOpen={correctionsOpen}
        corrections={allCorrections}
        onClose={() => setCorrectionsOpen(false)}
      />

      {/* Fallback keyboard */}
      <VoiceFallbackInput
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onSend={voice.sendTextMessage}
        disabled={voice.isStreaming}
      />

      {/* Tool toasts (top right per mockup) */}
      <ToolToastContainer
        toasts={activeToasts}
        onDismiss={handleDismissToast}
        className="!fixed !top-[70px] !right-[18px] !bottom-auto !flex-col !gap-2"
      />

      {/* Tool tray */}
      {dismissedToasts.size > 0 && trayItems.length > 0 && (
        <ToolTray items={trayItems} />
      )}

      {/* Error */}
      {voice.error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-warm-soft border border-warm-med rounded-xl shadow-md z-50">
          <span className="text-[13px] text-accent-warm">{voice.error}</span>
        </div>
      )}
    </div>,
    document.body,
  )
}

function renderToolCard(toolName: string, output: Record<string, unknown>): React.ReactNode {
  if (toolName === 'showCorrection') {
    return (
      <CorrectionCard
        original={output.original as string}
        corrected={output.corrected as string}
        explanation={output.explanation as string}
        grammarPoint={output.grammarPoint as string | undefined}
      />
    )
  }
  if (toolName === 'showVocabularyCard') {
    return (
      <VocabularyCard
        word={output.word as string}
        reading={output.reading as string | undefined}
        meaning={output.meaning as string}
        partOfSpeech={output.partOfSpeech as string | undefined}
        exampleSentence={output.exampleSentence as string | undefined}
        notes={output.notes as string | undefined}
      />
    )
  }
  if (toolName === 'showGrammarNote') {
    return (
      <GrammarNote
        pattern={output.pattern as string}
        meaning={output.meaning as string}
        formation={output.formation as string}
        examples={output.examples as { japanese: string; english: string }[]}
        level={output.level as string | undefined}
      />
    )
  }
  return null
}
