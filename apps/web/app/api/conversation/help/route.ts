import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { withAuth } from '@/lib/api-helpers'

export const POST = withAuth(async (request, { userId: _userId }) => {
  const { query, recentHistory, targetLanguage } = await request.json()
  const lang = targetLanguage || 'Japanese'

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  }

  const historyBlock = recentHistory?.length
    ? `Here is the recent conversation the learner is having:\n${recentHistory.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\n\n`
    : ''

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: `You are a helpful language learning assistant. The student is in a live ${lang} voice conversation and needs your help.

You have access to their recent conversation history. Use it to give relevant, contextual answers.

Guidelines:
- Answer in English (this is a help sidebar, not the conversation itself)
- Reference specific things from their conversation when relevant
- Be concise — they need to get back to talking
- If they ask what something means, explain it
- If they ask how to say something, give the ${lang} with a brief explanation
- If they ask about grammar, explain briefly with 1-2 examples`,
      prompt: `${historyBlock}The learner asks: "${query}"`,
      maxOutputTokens: 400,
    })

    return NextResponse.json({ suggestion: text })
  } catch (err) {
    console.error('[help] Failed:', err)
    return NextResponse.json({ suggestion: 'Sorry, I couldn\'t generate a suggestion right now.' })
  }
})
