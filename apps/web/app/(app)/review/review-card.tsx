'use client'

import { useState, useEffect, useCallback } from 'react'
import { TextField } from '@radix-ui/themes'
import type { ReviewQueueItem, ReviewGrade } from '@linguist/shared/types'
import { MASTERY_COLORS, formatMasteryLabel } from '@/constants/mastery'

interface ReviewCardProps {
  item: ReviewQueueItem
  onGrade: (grade: ReviewGrade) => void
}

const GRADE_CONFIG: Array<{
  grade: ReviewGrade; label: string; color: string; bgColor: string; key: string
}> = [
  { grade: 'again', label: 'Again', color: 'text-red-700', bgColor: 'bg-red-50 hover:bg-red-100', key: '1' },
  { grade: 'hard', label: 'Hard', color: 'text-orange-700', bgColor: 'bg-orange-50 hover:bg-orange-100', key: '2' },
  { grade: 'good', label: 'Good', color: 'text-green-700', bgColor: 'bg-green-50 hover:bg-green-100', key: '3' },
  { grade: 'easy', label: 'Easy', color: 'text-blue-700', bgColor: 'bg-blue-50 hover:bg-blue-100', key: '4' },
]

const MASTERY_TW_COLORS: Record<string, string> = {
  unseen: 'bg-gray-100 text-gray-700',
  introduced: 'bg-gray-100 text-gray-700',
  apprentice_1: 'bg-orange-100 text-orange-700',
  apprentice_2: 'bg-orange-100 text-orange-700',
  apprentice_3: 'bg-orange-100 text-orange-700',
  apprentice_4: 'bg-orange-100 text-orange-700',
  journeyman: 'bg-blue-100 text-blue-700',
  expert: 'bg-green-100 text-green-700',
  master: 'bg-purple-100 text-purple-700',
  burned: 'bg-yellow-100 text-yellow-700',
}

export function ReviewCard({ item, onGrade }: ReviewCardProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [typedAnswer, setTypedAnswer] = useState('')

  const isProduction = item.modality === 'production'

  useEffect(() => {
    setSide('front')
    setTypedAnswer('')
  }, [item.id, item.modality])

  const showAnswer = useCallback(() => { setSide('back') }, [])

  const handleGrade = useCallback((grade: ReviewGrade) => { onGrade(grade) }, [onGrade])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isProduction && side === 'front' && e.key !== 'Enter') return
      if (side === 'front' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        showAnswer()
        return
      }
      if (side === 'back') {
        const gradeMap: Record<string, ReviewGrade> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }
        const grade = gradeMap[e.key]
        if (grade) { e.preventDefault(); handleGrade(grade) }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [side, isProduction, showAnswer, handleGrade])

  return (
    <div className="max-w-[500px] mx-auto rounded-xl border border-gray-200 bg-white p-8 min-h-[300px]">
      {side === 'front' ? (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[220px]">
          {isProduction ? (
            <>
              <span className="text-sm text-gray-500">Produce the word for:</span>
              <span className="text-3xl font-bold text-center">{item.meaning}</span>
              {item.reading && <span className="text-base text-gray-500">Reading: {item.reading}</span>}
              <div className="w-full max-w-[300px] mt-2">
                {/* Keep Radix TextField for now */}
                <TextField.Root
                  size="3"
                  placeholder="Type your answer..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); showAnswer() } }}
                  autoFocus
                />
              </div>
              <button
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-blue-50 px-5 py-2.5 text-base font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={showAnswer}
              >
                Submit <kbd className="ml-1 rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Enter</kbd>
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-500">What does this mean?</span>
              <span className="text-5xl font-bold text-center leading-snug">{item.surfaceForm}</span>
              {item.reading && <span className="text-lg text-gray-500">{item.reading}</span>}
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-50 px-5 py-2.5 text-base font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={showAnswer}
              >
                Show Answer <kbd className="ml-1 rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Space</kbd>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 min-h-[220px]">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl font-bold">{item.surfaceForm}</span>
            {item.reading && <span className="text-lg text-gray-500">{item.reading}</span>}
          </div>
          <span className="text-xl text-center">{item.meaning}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${MASTERY_TW_COLORS[item.masteryState] ?? 'bg-gray-100 text-gray-700'}`}>
            {formatMasteryLabel(item.masteryState)}
          </span>
          {isProduction && typedAnswer && (
            <div
              className={`w-full max-w-[300px] px-4 py-2 rounded-md text-center ${
                typedAnswer.trim() === item.surfaceForm ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <span className="text-base">Your answer: <strong>{typedAnswer}</strong></span>
            </div>
          )}
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {GRADE_CONFIG.map(({ grade, label, color, bgColor, key }) => (
              <button
                key={grade}
                className={`min-w-[90px] inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-base font-medium transition-colors ${color} ${bgColor}`}
                onClick={() => handleGrade(grade)}
              >
                {label}
                <kbd className="ml-1 rounded border border-gray-300 bg-white/50 px-1.5 py-0.5 text-xs font-mono">{key}</kbd>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
