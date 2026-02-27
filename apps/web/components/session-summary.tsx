'use client'

import { Check, X, AlertTriangle, Sparkles } from 'lucide-react'
import type { PostSessionAnalysis } from '@linguist/shared/types'

interface SessionSummaryCardProps {
  analysis: PostSessionAnalysis
  durationSeconds: number
  totalTargets: number
}

export function SessionSummaryCard({
  analysis,
  durationSeconds,
  totalTargets,
}: SessionSummaryCardProps) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60))
  const hitCount = analysis.targetsHit?.length ?? 0
  const errorCount = analysis.errorsLogged?.length ?? 0
  const newCount = analysis.newItemsEncountered?.length ?? 0

  return (
    <div className="my-3 max-w-[520px] rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <span className="text-base font-bold">Session Summary</span>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold">{minutes}</span>
            <span className="text-xs text-gray-500">min</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold text-green-600">{hitCount}/{totalTargets}</span>
            <span className="text-xs text-gray-500">challenges</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={`text-xl font-bold ${errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{errorCount}</span>
            <span className="text-xs text-gray-500">errors</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold text-blue-600">{newCount}</span>
            <span className="text-xs text-gray-500">new items</span>
          </div>
        </div>

        {analysis.targetsHit && analysis.targetsHit.length > 0 && (
          <>
            <hr className="border-gray-200" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Targets Hit</span>
              {analysis.targetsHit.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <Check size={12} className="text-green-600" />
                  <span className="text-sm">Item #{id}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {errorCount > 0 && (
          <>
            <hr className="border-gray-200" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Errors</span>
              {analysis.errorsLogged.map((err, i) => (
                <div key={i} className="flex items-center gap-2">
                  <X size={12} className="text-red-600" />
                  <span className="text-sm">{err.contextQuote || `${err.errorType} on item #${err.itemId}`}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {analysis.avoidanceEvents && analysis.avoidanceEvents.length > 0 && (
          <>
            <hr className="border-gray-200" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Avoidance Detected</span>
              {analysis.avoidanceEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-sm">{ev.contextQuote || `Item #${ev.itemId}`}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {analysis.overallAssessment && (
          <>
            <hr className="border-gray-200" />
            <span className="text-sm text-gray-500 italic">
              {analysis.overallAssessment}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
