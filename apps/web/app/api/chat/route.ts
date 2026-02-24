import { withAuth } from '@/lib/api-helpers'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export const POST = withAuth(async (request) => {
  const { messages } = await request.json()
  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
    maxOutputTokens: 4096,
  })
  return result.toUIMessageStreamResponse()
})
