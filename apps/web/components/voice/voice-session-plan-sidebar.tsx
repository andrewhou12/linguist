'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { SessionPlan } from '@/lib/session-plan'
import { isConversationPlan, isTutorPlan } from '@/lib/session-plan'

interface VoiceSessionPlanSidebarProps {
  isOpen: boolean
  plan: SessionPlan | null
  onCollapse: () => void
  onSteer: (text: string) => void
  steeringMessages: Array<{ text: string; time: string }>
  className?: string
}

export function VoiceSessionPlanSidebar({
  isOpen, plan, onCollapse, onSteer, steeringMessages,
}: VoiceSessionPlanSidebarProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const val = inputValue.trim()
    if (!val) return
    onSteer(val)
    setInputValue('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }, [inputValue, onSteer])

  // Scroll to bottom when steering messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [steeringMessages])

  return (
    <div
      className={cn(
        'fixed left-0 top-0 bottom-0 w-[290px] z-[10] flex flex-col overflow-hidden transition-transform duration-[380ms] ease-[cubic-bezier(.76,0,.24,1)]',
        'bg-bg-pure border-r border-border',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border shrink-0">
        <div className="text-[13px] font-semibold text-text-primary tracking-[-0.01em]">Session Plan</div>
        <button
          onClick={onCollapse}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary shrink-0"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Plan content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-3.5 pb-2 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
        <div className="voice-plan-body">
          {plan && <PlanContent plan={plan} />}

          {/* Steering messages */}
          {steeringMessages.map((msg, i) => (
            <div key={i} className="voice-steer-msg">
              <span className="text-[9.5px] text-text-muted tracking-[.03em]">Your instruction &middot; {msg.time}</span>
              <span className="text-[11.5px] text-text-primary leading-[1.5]">{msg.text}</span>
              <span className="inline-flex items-center gap-1 text-[9.5px] text-green font-medium mt-0.5">
                &#10003; Applied to next response
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Steering input */}
      <div className="shrink-0 border-t border-border px-3 py-2.5 flex flex-col gap-[7px]">
        <div className="text-[10px] font-semibold tracking-[.09em] uppercase text-text-muted">Adjust Plan</div>
        <div className="flex gap-[7px] items-end">
          <div className="flex-1 bg-[rgba(255,255,255,.88)] border-[1.5px] border-border rounded-2xl overflow-hidden transition-all focus-within:border-border-strong focus-within:shadow-[0_0_0_3px_rgba(47,47,47,.05)]">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => {
                setInputValue(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
              }}
              rows={1}
              placeholder="e.g. talk more about travel..."
              className="w-full px-[11px] py-2 font-sans text-[12.5px] text-text-primary bg-transparent border-none outline-none resize-none leading-[1.5] min-h-[34px] max-h-[80px] placeholder:text-text-muted"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="w-[34px] h-[34px] rounded-[10px] border-none cursor-pointer bg-accent-brand flex items-center justify-center shadow-[0_1px_4px_rgba(47,47,47,.2)] transition-all shrink-0 hover:bg-[#111] hover:-translate-y-px disabled:opacity-[.28] disabled:pointer-events-none"
          >
            <ArrowRightIcon className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PlanContent({ plan }: { plan: SessionPlan }) {
  if (isConversationPlan(plan)) {
    // Collect focus points from dynamic/tension/culturalContext
    const focusPoints: string[] = []
    if (plan.dynamic) focusPoints.push(plan.dynamic)
    if (plan.tension) focusPoints.push(plan.tension)
    if (plan.culturalContext) focusPoints.push(plan.culturalContext)

    return (
      <>
        <h3>Session Goal</h3>
        <p>
          <strong>{plan.topic}</strong>
          {plan.setting ? ` — ${plan.setting}` : ''}
        </p>

        {focusPoints.length > 0 && (
          <>
            <h3>Today&apos;s Focus</h3>
            <ul>
              {focusPoints.map((fp, i) => <li key={i}>{fp}</li>)}
            </ul>
          </>
        )}

        <h3>Character</h3>
        <ul>
          {plan.persona.name && <li><strong>{plan.persona.name}</strong> &mdash; {plan.persona.relationship}</li>}
          {!plan.persona.name && <li>{plan.persona.relationship}</li>}
          <li>{plan.persona.personality}</li>
          {plan.register && <li>Register: {plan.register}</li>}
          {plan.tone && <li>Tone: {plan.tone}</li>}
        </ul>
      </>
    )
  }

  if (isTutorPlan(plan)) {
    const vocabConcepts = plan.concepts.filter(c => c.type === 'vocabulary')
    const grammarConcepts = plan.concepts.filter(c => c.type === 'grammar')
    const usageConcepts = plan.concepts.filter(c => c.type === 'usage')

    return (
      <>
        <h3>Session Goal</h3>
        <p><strong>{plan.topic}</strong></p>
        <p>{plan.objective}</p>

        <h3>Lesson Steps</h3>
        <ol>
          {plan.steps.map((s, i) => (
            <li key={i}>
              {s.status === 'completed' ? '✓ ' : s.status === 'active' ? '▸ ' : ''}
              {s.title}
            </li>
          ))}
        </ol>

        {vocabConcepts.length > 0 && (
          <>
            <h3>Vocabulary Targets</h3>
            <p className="plan-inline-list">
              {vocabConcepts.map(c => c.label).join('、')}
            </p>
          </>
        )}

        {grammarConcepts.length > 0 && (
          <>
            <h3>Grammar Points</h3>
            <ol>
              {grammarConcepts.map((c, i) => <li key={i}>{c.label}</li>)}
            </ol>
          </>
        )}

        {usageConcepts.length > 0 && (
          <>
            <h3>Usage</h3>
            <ul>
              {usageConcepts.map((c, i) => <li key={i}>{c.label}</li>)}
            </ul>
          </>
        )}
      </>
    )
  }

  // Immersion/reference fallback
  const base = plan as { focus?: string; goals?: string[]; approach?: string; milestones?: Array<{ description: string; completed: boolean }>; targetVocabulary?: string[] }
  return (
    <>
      {base.focus && (
        <>
          <h3>Session Goal</h3>
          <p><strong>{base.focus}</strong></p>
        </>
      )}
      {base.goals && base.goals.length > 0 && (
        <>
          <h3>Today&apos;s Focus</h3>
          <ul>
            {base.goals.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </>
      )}
      {base.targetVocabulary && base.targetVocabulary.length > 0 && (
        <>
          <h3>Vocabulary Targets</h3>
          <p className="plan-inline-list">
            {base.targetVocabulary.join('、')}
          </p>
        </>
      )}
      {base.approach && (
        <>
          <h3>Progression</h3>
          <p>{base.approach}</p>
        </>
      )}
      {base.milestones && base.milestones.length > 0 && (
        <>
          <h3>Milestones</h3>
          <ul>
            {base.milestones.map((m, i) => (
              <li key={i}>{m.completed ? '✓ ' : '○ '}{m.description}</li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
