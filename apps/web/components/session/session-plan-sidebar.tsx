'use client'

import { useRef, useEffect } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { SessionPlan } from '@/lib/session-plan'
import { isConversationPlan, isTutorPlan } from '@/lib/session-plan'

interface SessionPlanSidebarProps {
  isOpen: boolean
  plan: SessionPlan | null
  onCollapse: () => void
  steeringMessages: Array<{ text: string; time: string }>
  className?: string
  currentSectionId?: string
  completedSectionIds?: string[]
}

export function planToText(plan: SessionPlan): string {
  const lines: string[] = []

  if (isConversationPlan(plan)) {
    lines.push(`Topic: ${plan.topic}`)
    if (plan.setting) lines.push(`Setting: ${plan.setting}`)
    if (plan.persona.name) lines.push(`Character: ${plan.persona.name} — ${plan.persona.relationship}`)
    else lines.push(`Character: ${plan.persona.relationship}`)
    lines.push(`Personality: ${plan.persona.personality}`)
    if (plan.register) lines.push(`Register: ${plan.register}`)
    if (plan.tone) lines.push(`Tone: ${plan.tone}`)
    if (plan.dynamic) lines.push(`Dynamic: ${plan.dynamic}`)
    if (plan.tension) lines.push(`Tension: ${plan.tension}`)
    if (plan.culturalContext) lines.push(`Cultural context: ${plan.culturalContext}`)
  } else if (isTutorPlan(plan)) {
    lines.push(`Topic: ${plan.topic}`)
    lines.push(`Objective: ${plan.objective}`)
    if (plan.steps.length > 0) {
      lines.push(`\nSteps:`)
      for (const s of plan.steps) {
        lines.push(`- ${s.title}`)
      }
    }
    const concepts = plan.concepts.map(c => c.label)
    if (concepts.length > 0) lines.push(`\nConcepts: ${concepts.join(', ')}`)
  } else {
    const base = plan as { focus?: string; goals?: string[]; approach?: string; targetVocabulary?: string[] }
    if (base.focus) lines.push(`Focus: ${base.focus}`)
    if (base.goals?.length) {
      lines.push(`\nGoals:`)
      for (const g of base.goals) lines.push(`- ${g}`)
    }
    if (base.targetVocabulary?.length) {
      lines.push(`\nVocabulary: ${base.targetVocabulary.join(', ')}`)
    }
    if (base.approach) lines.push(`\nApproach: ${base.approach}`)
  }

  return lines.join('\n')
}

export function SessionPlanSidebar({
  isOpen, plan, onCollapse, steeringMessages, currentSectionId, completedSectionIds, className,
}: SessionPlanSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when steering messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [steeringMessages])

  return (
    <div
      className={cn(
        'fixed left-0 top-0 bottom-0 w-[340px] z-[10] flex flex-col overflow-hidden transition-transform duration-[380ms] ease-[cubic-bezier(.76,0,.24,1)]',
        'bg-bg-pure border-r border-border',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <div className="text-[15px] font-semibold text-text-primary tracking-[-0.02em]">Session Plan</div>
        <button
          onClick={onCollapse}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary shrink-0"
        >
          <XMarkIcon className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Plan content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
        <div className="voice-plan-body">
            {plan && <PlanContent plan={plan} currentSectionId={currentSectionId} completedSectionIds={completedSectionIds} />}

            {/* Steering messages */}
            {steeringMessages.map((msg, i) => (
              <div key={i} className="voice-steer-msg">
                <span className="text-[11px] text-text-muted tracking-[.03em]">Your instruction &middot; {msg.time}</span>
                <span className="text-[13px] text-text-primary leading-[1.6]">{msg.text}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-green font-medium mt-0.5">
                  &#10003; Applied to next response
                </span>
              </div>
            ))}
          </div>
      </div>
    </div>
  )
}

function PlanContent({ plan, currentSectionId, completedSectionIds }: { plan: SessionPlan; currentSectionId?: string; completedSectionIds?: string[] }) {
  if (isConversationPlan(plan)) {
    // Collect focus points from dynamic/tension/culturalContext
    const focusPoints: string[] = []
    if (plan.dynamic) focusPoints.push(plan.dynamic)
    if (plan.tension) focusPoints.push(plan.tension)
    if (plan.culturalContext) focusPoints.push(plan.culturalContext)

    const completedSet = new Set(completedSectionIds || [])

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

        {plan.sections && plan.sections.length > 0 && (
          <>
            <h3>Conversation Flow</h3>
            <ul className="!list-none !pl-0 flex flex-col gap-1">
              {plan.sections.map((section) => {
                const isCompleted = completedSet.has(section.id)
                const isActive = section.id === currentSectionId && !isCompleted
                return (
                  <li key={section.id} className="flex items-start gap-2 !pl-0 !ml-0">
                    <div className="shrink-0 mt-[5px]">
                      {isCompleted ? (
                        <CheckIcon className="w-3.5 h-3.5 text-text-muted" />
                      ) : (
                        <div className={cn(
                          'w-[7px] h-[7px] rounded-full mt-[2px]',
                          isActive ? 'bg-accent-brand' : 'bg-border-strong',
                        )} />
                      )}
                    </div>
                    <span className={cn(
                      'text-[13px] leading-[1.5]',
                      isCompleted ? 'text-text-muted line-through' : isActive ? 'text-text-primary font-semibold' : 'text-text-secondary',
                    )}>
                      {section.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
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
              {s.status === 'completed' ? '\u2713 ' : s.status === 'active' ? '\u25B8 ' : ''}
              {s.title}
            </li>
          ))}
        </ol>

        {vocabConcepts.length > 0 && (
          <>
            <h3>Vocabulary Targets</h3>
            <p className="plan-inline-list">
              {vocabConcepts.map(c => c.label).join('\u3001')}
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
            {base.targetVocabulary.join('\u3001')}
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
              <li key={i}>{m.completed ? '\u2713 ' : '\u25CB '}{m.description}</li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
