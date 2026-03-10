'use client'

import { useMemo, useCallback } from 'react'
import { CheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { SessionPlan } from '@/lib/session-plan'
import { isConversationPlan, isTutorPlan } from '@/lib/session-plan'

interface FlowStep {
  id: string
  label: string
  status: 'completed' | 'active' | 'upcoming'
}

interface ConversationFlowPanelProps {
  plan: SessionPlan | null
  currentSectionId?: string
  completedSectionIds?: string[]
  duration: number
  onOpenFullPlan?: () => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getSteps(
  plan: SessionPlan,
  currentSectionId?: string,
  completedSectionIds?: string[],
): FlowStep[] {
  const completedSet = new Set(completedSectionIds || [])

  if (isConversationPlan(plan) && plan.sections?.length) {
    return plan.sections.map((s) => ({
      id: s.id,
      label: s.label,
      status: completedSet.has(s.id)
        ? 'completed'
        : s.id === currentSectionId && !completedSet.has(s.id)
          ? 'active'
          : 'upcoming',
    }))
  }

  if (isTutorPlan(plan) && plan.steps?.length) {
    return plan.steps.map((s, i) => ({
      id: `step-${i}`,
      label: s.title,
      status: s.status === 'completed' || s.status === 'skipped'
        ? 'completed'
        : s.status === 'active'
          ? 'active'
          : 'upcoming',
    }))
  }

  // Immersion/reference: use milestones
  const base = plan as { milestones?: Array<{ description: string; completed: boolean }> }
  if (base.milestones?.length) {
    return base.milestones.map((m, i) => ({
      id: `milestone-${i}`,
      label: m.description,
      status: m.completed ? 'completed' : 'upcoming',
    }))
  }

  return []
}

function getPlanTitle(plan: SessionPlan): string {
  if (isConversationPlan(plan)) return plan.topic
  if (isTutorPlan(plan)) return plan.topic
  const base = plan as { focus?: string; topic?: string }
  return base.topic || base.focus || 'Session'
}

export function ConversationFlowPanel({
  plan,
  currentSectionId,
  completedSectionIds,
  duration,
  onOpenFullPlan,
}: ConversationFlowPanelProps) {
  const steps = useMemo(
    () => (plan ? getSteps(plan, currentSectionId, completedSectionIds) : []),
    [plan, currentSectionId, completedSectionIds],
  )

  const title = plan ? getPlanTitle(plan) : ''

  const completedCount = steps.filter((s) => s.status === 'completed').length
  const activeIdx = steps.findIndex((s) => s.status === 'active')

  const handleOpenPlan = useCallback(() => {
    onOpenFullPlan?.()
  }, [onOpenFullPlan])

  return (
    <div className="fixed left-6 top-[72px] bottom-6 z-[9] w-[280px] flex flex-col bg-bg-pure border border-border-subtle rounded-lg shadow-[0_1px_2px_rgba(0,0,0,.04),0_1px_4px_rgba(0,0,0,.03)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-medium text-text-secondary">Flow</span>
          <span className="text-[13px] tabular-nums text-text-secondary">{formatTime(duration)}</span>
        </div>
        {title && (
          <div className="text-[15px] font-semibold text-text-primary leading-[1.4] tracking-[-0.01em] line-clamp-2">
            {title}
          </div>
        )}
        {steps.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-[3px] bg-bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-brand rounded-full transition-all duration-500"
                style={{ width: `${steps.length > 0 ? ((completedCount + (activeIdx >= 0 ? 0.5 : 0)) / steps.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[12px] text-text-secondary tabular-nums">{completedCount}/{steps.length}</span>
          </div>
        )}
      </div>

      {/* Steps timeline */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
        {steps.length > 0 ? (
          <div className="flex flex-col gap-1">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-start gap-3 py-1.5">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center shrink-0 mt-[3px]">
                  {step.status === 'completed' ? (
                    <div className="w-[18px] h-[18px] rounded-full bg-accent-brand/10 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-accent-brand" />
                    </div>
                  ) : step.status === 'active' ? (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-accent-brand flex items-center justify-center">
                      <div className="w-[7px] h-[7px] rounded-full bg-accent-brand" />
                    </div>
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-border-strong" />
                  )}
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className={cn(
                      'w-[1.5px] h-3 mt-0.5',
                      step.status === 'completed' ? 'bg-accent-brand/20' : 'bg-border',
                    )} />
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  'text-[14px] leading-[1.4] pt-px',
                  step.status === 'completed' && 'text-text-secondary line-through',
                  step.status === 'active' && 'text-text-primary font-semibold',
                  step.status === 'upcoming' && 'text-text-secondary',
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[14px] text-text-secondary text-center py-6">
            No flow steps available
          </div>
        )}
      </div>

      {/* Footer */}
      {onOpenFullPlan && (
        <div className="shrink-0 border-t border-border px-4 py-3">
          <button
            onClick={handleOpenPlan}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer bg-transparent border-none"
          >
            <span>Full plan</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
