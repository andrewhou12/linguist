import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { withAuth } from '@/lib/api-helpers'

export const POST = withAuth(async (request) => {
  const { sentence } = await request.json()

  if (!sentence || typeof sentence !== 'string') {
    return NextResponse.json({ error: 'Missing sentence' }, { status: 400 })
  }

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: `You are a Japanese language analysis tool. Given a Japanese sentence, break it down into individual tokens with linguistic information.

Return ONLY valid JSON — no markdown fences, no explanation. The format must be:
{
  "tokens": [
    {
      "surface": "the token as written",
      "reading": "hiragana reading",
      "romaji": "romaji transliteration",
      "pos": "part of speech (noun, verb, adj, particle, adverb, conj, aux, punct, other)",
      "meaning": "brief English meaning"
    }
  ]
}

Be thorough: include every token including particles and punctuation. For particles, give their grammatical function as the meaning (e.g. "topic marker", "object marker").`,
    prompt: sentence,
    maxOutputTokens: 4096,
  })

  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
  }

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[xray] Failed to parse LLM response:', cleaned.slice(-100))
    return NextResponse.json(
      { error: 'Failed to parse analysis response' },
      { status: 502 }
    )
  }

  return NextResponse.json(parsed)
})
