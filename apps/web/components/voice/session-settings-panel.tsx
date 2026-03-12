'use client'

import { useState } from 'react'
import { XMarkIcon, ArrowUpIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { SessionPlan } from '@/lib/session-plan'
import { planToText } from '@/components/session/session-plan-sidebar'
import { isConversationPlan, isTutorPlan } from '@/lib/session-plan'

export interface SessionSettings {
  vocabCards: boolean
  introduceNewItems: boolean
  autoTranslate: boolean
  autoSuggest: boolean
}

interface SessionSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: SessionSettings
  onSettingsChange: (s: SessionSettings) => void
  plan?: SessionPlan | null
  onPlanSave?: (text: string) => void
  onSteer?: (text: string) => void
  currentSectionId?: string
  completedSectionIds?: string[]
}

function PlanView({ plan, currentSectionId, completedSectionIds }: { plan: SessionPlan; currentSectionId?: string; completedSectionIds?: string[] }) {
  const completedSet = new Set(completedSectionIds || [])

  if (isConversationPlan(plan)) {
    const focusPoints: string[] = []
    if (plan.dynamic) focusPoints.push(plan.dynamic)
    if (plan.tension) focusPoints.push(plan.tension)
    if (plan.culturalContext) focusPoints.push(plan.culturalContext)

    return (
      <div className="flex flex-col gap-4 text-[13px] leading-[1.6] text-text-primary">
        <div>
          <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Topic</div>
          <div className="font-medium">{plan.topic}</div>
          {plan.setting && <div className="text-text-secondary mt-0.5">{plan.setting}</div>}
        </div>

        {plan.persona?.name && (
          <div>
            <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Character</div>
            <div><span className="font-medium">{plan.persona.name}</span> — {plan.persona.relationship}</div>
            <div className="text-text-secondary mt-0.5">{plan.persona.personality}</div>
            {plan.register && <div className="text-text-secondary mt-0.5">Register: {plan.register}</div>}
          </div>
        )}

        {focusPoints.length > 0 && (
          <div>
            <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Focus</div>
            <ul className="list-none p-0 m-0 flex flex-col gap-1">
              {focusPoints.map((fp, i) => (
                <li key={i} className="text-text-secondary">• {fp}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.sections && plan.sections.length > 0 && (
          <div>
            <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Conversation Flow</div>
            <div className="flex flex-col gap-1.5">
              {plan.sections.map((section) => {
                const isCompleted = completedSet.has(section.id)
                const isActive = section.id === currentSectionId && !isCompleted
                return (
                  <div key={section.id} className="flex items-start gap-2.5">
                    <div className="shrink-0 mt-[5px]">
                      {isCompleted ? (
                        <CheckIcon className="w-3.5 h-3.5 text-green" />
                      ) : (
                        <div className={cn(
                          'w-[7px] h-[7px] rounded-full',
                          isActive ? 'bg-accent-brand' : 'bg-border-strong',
                        )} />
                      )}
                    </div>
                    <span className={cn(
                      isCompleted ? 'text-text-muted line-through' : isActive ? 'text-text-primary font-semibold' : 'text-text-secondary',
                    )}>
                      {section.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isTutorPlan(plan)) {
    return (
      <div className="flex flex-col gap-4 text-[13px] leading-[1.6] text-text-primary">
        <div>
          <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Topic</div>
          <div className="font-medium">{plan.topic}</div>
          <div className="text-text-secondary mt-0.5">{plan.objective}</div>
        </div>
        {plan.steps.length > 0 && (
          <div>
            <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Steps</div>
            <ol className="list-decimal pl-4 m-0 flex flex-col gap-1 text-text-secondary">
              {plan.steps.map((s, i) => (
                <li key={i} className={cn(s.status === 'completed' && 'text-text-muted line-through', s.status === 'active' && 'text-text-primary font-medium')}>
                  {s.title}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    )
  }

  // Fallback
  const base = plan as { focus?: string; goals?: string[]; approach?: string }
  return (
    <div className="flex flex-col gap-4 text-[13px] leading-[1.6] text-text-primary">
      {base.focus && (
        <div>
          <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Focus</div>
          <div className="font-medium">{base.focus}</div>
        </div>
      )}
      {base.goals && base.goals.length > 0 && (
        <div>
          <div className="text-[12px] font-medium text-text-muted uppercase tracking-[0.05em] mb-1.5">Goals</div>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {base.goals.map((g, i) => <li key={i} className="text-text-secondary">• {g}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export function SessionSettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  plan,
  onPlanSave,
  onSteer,
  currentSectionId,
  completedSectionIds,
}: SessionSettingsPanelProps) {
  const [showPlanEditor, setShowPlanEditor] = useState(false)
  const [planEditText, setPlanEditText] = useState('')
  const [steerValue, setSteerValue] = useState('')

  const handleSteer = () => {
    if (!steerValue.trim() || !onSteer) return
    onSteer(steerValue.trim())
    setSteerValue('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none"
          >
            <div className="w-full max-w-[520px] max-h-[75vh] bg-bg-pure border border-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,.12),0_4px_16px_rgba(0,0,0,.08)] flex flex-col overflow-hidden pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
                <div className="text-[15px] font-semibold text-text-primary tracking-[-0.02em]">Session Settings</div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-text-muted cursor-pointer transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  <XMarkIcon className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">

                {/* Session plan view */}
                {plan && (
                  <div>
                    <div className="text-[13px] font-medium text-text-primary mb-3">Session Plan</div>
                    <div className="rounded-xl bg-bg-secondary border border-border-subtle px-4 py-3.5">
                      <PlanView plan={plan} currentSectionId={currentSectionId} completedSectionIds={completedSectionIds} />
                    </div>
                  </div>
                )}

                <div className="w-full h-px bg-border" />

                {/* Toggles */}
                <div className="flex flex-col gap-5">
                  {/* Introduce new vocab/grammar toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-text-primary">Introduce new vocabulary/grammar</div>
                      <p className="text-[12px] text-text-muted mt-0.5 leading-[1.4]">When on, the AI will use words and grammar slightly above your level</p>
                    </div>
                    <button
                      onClick={() => onSettingsChange({ ...settings, introduceNewItems: !settings.introduceNewItems })}
                      className={cn(
                        'relative w-10 h-[22px] rounded-full border-none cursor-pointer transition-colors shrink-0 mt-0.5',
                        settings.introduceNewItems ? 'bg-accent-brand' : 'bg-border-strong',
                      )}
                    >
                      <span className={cn(
                        'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        settings.introduceNewItems ? 'left-[21px]' : 'left-[3px]',
                      )} />
                    </button>
                  </div>

                  {/* Vocabulary cards toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-text-primary">Vocabulary cards</div>
                      <p className="text-[12px] text-text-muted mt-0.5 leading-[1.4]">Show vocabulary cards for new words in the session notes</p>
                    </div>
                    <button
                      onClick={() => onSettingsChange({ ...settings, vocabCards: !settings.vocabCards })}
                      className={cn(
                        'relative w-10 h-[22px] rounded-full border-none cursor-pointer transition-colors shrink-0 mt-0.5',
                        settings.vocabCards ? 'bg-accent-brand' : 'bg-border-strong',
                      )}
                    >
                      <span className={cn(
                        'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        settings.vocabCards ? 'left-[21px]' : 'left-[3px]',
                      )} />
                    </button>
                  </div>

                  {/* Auto-translate toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-text-primary">Auto-translate</div>
                      <p className="text-[12px] text-text-muted mt-0.5 leading-[1.4]">Always show English translation below the AI&apos;s response</p>
                    </div>
                    <button
                      onClick={() => onSettingsChange({ ...settings, autoTranslate: !settings.autoTranslate })}
                      className={cn(
                        'relative w-10 h-[22px] rounded-full border-none cursor-pointer transition-colors shrink-0 mt-0.5',
                        settings.autoTranslate ? 'bg-accent-brand' : 'bg-border-strong',
                      )}
                    >
                      <span className={cn(
                        'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        settings.autoTranslate ? 'left-[21px]' : 'left-[3px]',
                      )} />
                    </button>
                  </div>

                  {/* Auto-suggest toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-text-primary">Auto-suggest</div>
                      <p className="text-[12px] text-text-muted mt-0.5 leading-[1.4]">Always show a suggested response you can use</p>
                    </div>
                    <button
                      onClick={() => onSettingsChange({ ...settings, autoSuggest: !settings.autoSuggest })}
                      className={cn(
                        'relative w-10 h-[22px] rounded-full border-none cursor-pointer transition-colors shrink-0 mt-0.5',
                        settings.autoSuggest ? 'bg-accent-brand' : 'bg-border-strong',
                      )}
                    >
                      <span className={cn(
                        'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        settings.autoSuggest ? 'left-[21px]' : 'left-[3px]',
                      )} />
                    </button>
                  </div>
                </div>

                <div className="w-full h-px bg-border" />

                {/* Adjust plan */}
                {onSteer && (
                  <div>
                    <div className="text-[13px] font-medium text-text-primary mb-2">Adjust plan</div>
                    <div className="relative">
                      <input
                        value={steerValue}
                        onChange={e => setSteerValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && steerValue.trim()) handleSteer()
                        }}
                        placeholder="e.g. talk more about travel..."
                        className="w-full px-3 py-2 pr-8 text-[13px] text-text-primary bg-bg-pure border border-border rounded-lg outline-none font-sans placeholder:text-text-muted focus:border-border-strong transition-shadow"
                      />
                      {steerValue.trim() && (
                        <button
                          onClick={handleSteer}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-accent-brand flex items-center justify-center border-none cursor-pointer text-white"
                        >
                          <ArrowUpIcon className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit full plan */}
                {plan && onPlanSave && (
                  <div>
                    <button
                      onClick={() => {
                        if (!showPlanEditor) setPlanEditText(planToText(plan))
                        setShowPlanEditor(p => !p)
                      }}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary bg-transparent border-none cursor-pointer hover:text-text-primary transition-colors p-0"
                    >
                      <ChevronDownIcon className={cn('w-3.5 h-3.5 transition-transform', showPlanEditor && 'rotate-180')} />
                      Edit plan as text
                    </button>
                    {showPlanEditor && (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea
                          value={planEditText}
                          onChange={e => setPlanEditText(e.target.value)}
                          className="w-full min-h-[140px] px-3 py-2.5 font-sans text-[13px] text-text-primary bg-bg-pure border border-border rounded-lg outline-none resize-y leading-[1.6] focus:border-border-strong transition-shadow"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowPlanEditor(false)}
                            className="px-3 py-1.5 text-[12px] text-text-secondary bg-transparent border border-border rounded-lg cursor-pointer transition-colors hover:bg-bg-hover"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => { onPlanSave(planEditText); setShowPlanEditor(false) }}
                            disabled={!planEditText.trim()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-white bg-accent-brand border-none rounded-lg cursor-pointer transition-all hover:bg-[#111] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <CheckIcon className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
