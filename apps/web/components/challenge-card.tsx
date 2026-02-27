'use client'

import { Check, Circle } from 'lucide-react'
import type { ExpandedSessionPlan } from '@linguist/shared/types'

interface ChallengeCardProps {
  plan: ExpandedSessionPlan
  targetsHit: Set<string>
}

export function ChallengeCard({ plan, targetsHit }: ChallengeCardProps) {
  const vocabTargets = plan.targetVocabulary ?? []
  const grammarTargets = plan.targetGrammar ?? []
  const curriculumItems = plan.curriculumNewItems ?? []

  const allTargets: Array<{ id: string; label: string }> = [
    ...vocabTargets.map((id) => ({ id: String(id), label: `Vocab #${id}` })),
    ...grammarTargets.map((id) => ({ id: String(id), label: `Grammar #${id}` })),
    ...curriculumItems.map((c) => ({
      id: c.surfaceForm ?? c.patternId ?? 'unknown',
      label: c.surfaceForm ?? c.patternId ?? 'New item',
    })),
  ]

  if (allTargets.length === 0) return null

  const hitCount = allTargets.filter((t) => targetsHit.has(t.id)).length

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 border-b-gray-300 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500 shrink-0">
          Challenges ({hitCount}/{allTargets.length})
        </span>
        {allTargets.map((target) => {
          const isHit = targetsHit.has(target.id)
          return (
            <div key={target.id} className="flex items-center gap-1">
              {isHit ? (
                <Check size={12} className="text-green-600" />
              ) : (
                <Circle size={12} className="text-gray-400" />
              )}
              <span
                className={`text-xs ${isHit ? 'text-green-600 line-through' : 'text-gray-500'}`}
              >
                {target.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
