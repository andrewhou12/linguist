import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { withAuth } from '@/lib/api-helpers'

export const POST = withAuth(async (request, { userId: _userId }) => {
  const { recentHistory, targetLanguage } = await request.json()
  const lang = targetLanguage || 'Japanese'

  const historyBlock = recentHistory?.length
    ? `Recent conversation:\n${recentHistory.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\n\n`
    : ''

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: `You are a language learning hint system. The student is in a ${lang} conversation. Suggest 1-2 short, natural responses they could say next in ${lang}. Include a brief English translation in parentheses after each suggestion. Keep suggestions at or slightly above their current level.

Rules:
- Do NOT use markdown formatting (no bold, no headers, no bullet points)
- Do NOT number the suggestions
- Separate multiple suggestions with a blank line
- Do NOT explain grammar or add commentary
- Just give the plain phrases`,
      prompt: `${historyBlock}Suggest what the learner could say next.`,
      maxOutputTokens: 150,
    })
    return NextResponse.json({ suggestion: text })
  } catch (err) {
    console.error('[suggest] Failed:', err)
    return NextResponse.json({ suggestion: 'Could not generate a suggestion.' })
  }
})
