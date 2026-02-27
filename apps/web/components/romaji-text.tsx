'use client'

import { toRomaji } from 'wanakana'

const RUBY_REGEX = /\{([^}|]+)\|([^}]+)\}/
const KANA_RUN_REGEX = /([ぁ-ゖァ-ヺー]+)/

interface Segment {
  type: 'text' | 'ruby'
  content: string
  reading?: string
}

function tokenize(text: string): Segment[] {
  const segments: Segment[] = []
  let remaining = text

  while (remaining.length > 0) {
    const annotationMatch = remaining.match(RUBY_REGEX)
    const kanaMatch = remaining.match(KANA_RUN_REGEX)

    const annotationIdx = annotationMatch?.index ?? Infinity
    const kanaIdx = kanaMatch?.index ?? Infinity

    if (annotationIdx === Infinity && kanaIdx === Infinity) {
      segments.push({ type: 'text', content: remaining })
      break
    }

    if (annotationIdx <= kanaIdx) {
      if (annotationIdx > 0) {
        segments.push({ type: 'text', content: remaining.slice(0, annotationIdx) })
      }
      segments.push({
        type: 'ruby',
        content: annotationMatch![1],
        reading: toRomaji(annotationMatch![2]),
      })
      remaining = remaining.slice(annotationIdx + annotationMatch![0].length)
    } else {
      if (kanaIdx > 0) {
        segments.push({ type: 'text', content: remaining.slice(0, kanaIdx) })
      }
      segments.push({
        type: 'ruby',
        content: kanaMatch![0],
        reading: toRomaji(kanaMatch![0]),
      })
      remaining = remaining.slice(kanaIdx + kanaMatch![0].length)
    }
  }

  return segments
}

export function RomajiText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/)

  return (
    <div className={className}>
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n')
        return (
          <p key={pi} style={{ margin: '0 0 1em' }}>
            {lines.map((line, li) => {
              const segments = tokenize(line)
              return (
                <span key={li}>
                  {li > 0 && <br />}
                  {segments.map((seg, si) =>
                    seg.type === 'ruby' ? (
                      <ruby key={si}>
                        {seg.content}
                        <rp>(</rp>
                        <rt>{seg.reading}</rt>
                        <rp>)</rp>
                      </ruby>
                    ) : (
                      <span key={si}>{seg.content}</span>
                    )
                  )}
                </span>
              )
            })}
          </p>
        )
      })}
    </div>
  )
}
