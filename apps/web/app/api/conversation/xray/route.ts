import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { withAuth } from '@/lib/api-helpers'

const xraySchema = z.object({
  tokens: z.array(z.object({
    surface: z.string().describe('The token as written'),
    reading: z.string().describe('Hiragana reading'),
    romaji: z.string().describe('Romaji transliteration'),
    pos: z.string().describe('Part of speech (noun, verb, adj, particle, adverb, conj, aux, punct, other)'),
    meaning: z.string().describe('Brief English meaning'),
  }))
})

export const POST = withAuth(async (request) => {
  const { sentence } = await request.json()

  if (!sentence || typeof sentence !== 'string') {
    return NextResponse.json({ error: 'Missing sentence' }, { status: 400 })
  }

  try {
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: xraySchema,
      prompt: `Break down this sentence into individual tokens with linguistic information. Include every token including particles and punctuation. For particles, give their grammatical function as the meaning (e.g. "topic marker", "object marker").\n\nSentence: ${sentence}`,
    })
    return NextResponse.json(object)
  } catch (err) {
    console.error('[xray] Failed:', err)
    return NextResponse.json({ error: 'Failed to parse analysis response' }, { status: 502 })
  }
})
