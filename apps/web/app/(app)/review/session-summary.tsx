'use client'

import { useRouter } from 'next/navigation'
import type { SessionStats } from '@/hooks/use-review'

const MASTERY_TW_COLORS: Record<string, string> = {
  unseen: 'bg-gray-100 text-gray-700',
  introduced: 'bg-gray-100 text-gray-700',
  apprentice_1: 'bg-red-100 text-red-700',
  apprentice_2: 'bg-red-100 text-red-700',
  apprentice_3: 'bg-orange-100 text-orange-700',
  apprentice_4: 'bg-orange-100 text-orange-700',
  journeyman: 'bg-yellow-100 text-yellow-700',
  expert: 'bg-green-100 text-green-700',
  master: 'bg-blue-100 text-blue-700',
  burned: 'bg-purple-100 text-purple-700',
}

function formatMasteryLabel(state: string): string {
  return state.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function SessionSummary({ stats }: { stats: SessionStats }) {
  const router = useRouter()
  const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0

  return (
    <div className="max-w-[500px] mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Session Complete</h1>

      <div className="flex gap-4 mb-6 justify-center">
        <div className="min-w-[120px] text-center rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-sm text-gray-500">Reviewed</span>
            <span className="text-4xl font-bold">{stats.reviewed}</span>
          </div>
        </div>
        <div className="min-w-[120px] text-center rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-sm text-gray-500">Accuracy</span>
            <span className={`text-4xl font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-orange-500' : 'text-red-600'}`}>
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="h-2 rounded bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded transition-[width] duration-500 ease-out ${
              accuracy >= 80 ? 'bg-green-500' : accuracy >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {stats.masteryChanges.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3">
            <span className="text-base font-bold">Mastery Changes</span>
            {stats.masteryChanges.map((change, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <span className="text-sm min-w-[80px]">{change.surfaceForm}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MASTERY_TW_COLORS[change.from] ?? 'bg-gray-100 text-gray-700'}`}>
                  {formatMasteryLabel(change.from)}
                </span>
                <span className="text-sm text-gray-500">&rarr;</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MASTERY_TW_COLORS[change.to] ?? 'bg-gray-100 text-gray-700'}`}>
                  {formatMasteryLabel(change.to)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          className="rounded-md bg-blue-600 px-5 py-2.5 text-base font-medium text-white hover:bg-blue-700 transition-colors"
          onClick={() => router.push('/dashboard')}
        >
          Done
        </button>
      </div>
    </div>
  )
}
