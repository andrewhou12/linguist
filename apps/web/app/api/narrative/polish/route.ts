import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import Anthropic from '@anthropic-ai/sdk'
import { buildPolishPrompt } from '@linguist/core/narrative/prompt'

const anthropic = new Anthropic()

export const POST = withAuth(async (request) => {
  const { draft } = await request.json()
  const prompt = buildPolishPrompt(draft)
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20241022',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content.find((c) => c.type === 'text')
  return NextResponse.json(text?.type === 'text' ? text.text : draft.markdownBody)
})
