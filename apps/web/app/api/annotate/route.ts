import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export const POST = withAuth(async (request) => {
  const { texts }: { texts: string[] } = await request.json()
  if (!texts || texts.length === 0) return NextResponse.json({ annotated: [] })

  const joined = texts.map((t, i) => `[${i}] ${t}`).join('\n---\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Add hiragana readings to ALL kanji words in the following Japanese texts. Use the format {漢字|かんじ} — wrap every word containing kanji characters. Keep hiragana, katakana, romaji, English, punctuation, and all other text exactly as-is. Do not add or remove any text.

Each text is numbered [0], [1], etc., separated by ---. Return the annotated texts in the same format.

${joined}`,
    }],
  })

  const raw = response.content.find((c) => c.type === 'text')?.text ?? ''

  const parts = raw.split(/\n---\n/)
  const annotated = parts.map((p) => p.replace(/^\[\d+\]\s*/, '').trim())

  // Pad or trim to match input length
  while (annotated.length < texts.length) annotated.push(texts[annotated.length])

  return NextResponse.json({ annotated: annotated.slice(0, texts.length) })
})
