import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import Anthropic from '@anthropic-ai/sdk'
import type { ConversationMessage } from '@linguist/shared/types'
import type { Prisma } from '@prisma/client'

const anthropic = new Anthropic()

export const POST = withAuth(async (request) => {
  const { sessionId, message } = await request.json()

  const session = await prisma.conversationSession.findUniqueOrThrow({ where: { id: sessionId } })
  if (!session.systemPrompt) throw new Error('Session has no system prompt')

  const transcript = (session.transcript as unknown as ConversationMessage[]) ?? []
  const userMsg: ConversationMessage = { role: 'user', content: message, timestamp: new Date().toISOString() }
  transcript.push(userMsg)

  const recentMessages = transcript.slice(-30)
  const apiMessages = recentMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: session.systemPrompt,
    messages: apiMessages,
  })

  const textContent = response.content.find((c) => c.type === 'text')
  const assistantContent = textContent?.type === 'text' ? textContent.text : ''

  const assistantMsg: ConversationMessage = { role: 'assistant', content: assistantContent, timestamp: new Date().toISOString() }
  transcript.push(assistantMsg)

  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: { transcript: transcript as unknown as Prisma.InputJsonValue },
  })

  return NextResponse.json(assistantMsg)
})
