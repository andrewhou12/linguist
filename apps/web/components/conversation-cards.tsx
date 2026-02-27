'use client'

import { useState } from 'react'
import { BookOpen, Languages, AlertCircle, HelpCircle } from 'lucide-react'
import type { MessageSegment } from '@/lib/message-parser'

interface CardProps {
  segment: MessageSegment
}

export function VocabCard({ segment }: CardProps) {
  const d = segment.data ?? {}
  return (
    <div className="my-2 max-w-[480px] rounded-xl border border-gray-200 bg-white p-4 border-l-[3px] border-l-blue-600">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-blue-600" />
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            Vocabulary
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold">{d.surface ?? ''}</span>
          {d.reading && (
            <span className="text-sm text-gray-500">{d.reading}</span>
          )}
        </div>
        <span className="text-sm">{d.meaning ?? ''}</span>
        {d.example && (
          <div className="mt-1 p-2 bg-gray-100 rounded-md">
            <span className="text-sm block">{d.example}</span>
            {d.example_translation && (
              <span className="text-xs text-gray-500 block mt-1">
                {d.example_translation}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function GrammarCard({ segment }: CardProps) {
  const d = segment.data ?? {}
  return (
    <div className="my-2 max-w-[480px] rounded-xl border border-gray-200 bg-white p-4 border-l-[3px] border-l-purple-600">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Languages size={14} className="text-purple-600" />
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
            Grammar
          </span>
        </div>
        <span className="text-lg font-bold">{d.pattern ?? ''}</span>
        <span className="text-sm">{d.meaning ?? ''}</span>
        {d.formation && (
          <span className="text-xs text-gray-500">Formation: {d.formation}</span>
        )}
        {d.example && (
          <div className="mt-1 p-2 bg-gray-100 rounded-md">
            <span className="text-sm block">{d.example}</span>
            {d.example_translation && (
              <span className="text-xs text-gray-500 block mt-1">
                {d.example_translation}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function CorrectionCard({ segment }: CardProps) {
  const d = segment.data ?? {}
  return (
    <div className="my-2 max-w-[480px] rounded-xl border border-gray-200 bg-white p-4 border-l-[3px] border-l-red-600">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-red-600" />
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Correction
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-red-600 line-through">
            {d.incorrect ?? ''}
          </span>
          <span className="text-sm text-gray-500">&rarr;</span>
          <span className="text-sm font-medium text-green-600">
            {d.correct ?? ''}
          </span>
        </div>
        {d.explanation && (
          <span className="text-xs text-gray-500">{d.explanation}</span>
        )}
      </div>
    </div>
  )
}

export function ReviewPromptCard({ segment }: CardProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const d = segment.data ?? {}
  return (
    <div className="my-2 max-w-[480px] rounded-xl border border-gray-200 bg-white p-4 border-l-[3px] border-l-blue-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle size={14} className="text-blue-500" />
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            Review
          </span>
        </div>
        <span className="text-base font-medium">{d.prompt ?? ''}</span>
        {!showAnswer && (
          <button
            className="self-start rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </button>
        )}
      </div>
    </div>
  )
}
