import { prisma } from '@lingle/db'
import type { ConversationMessage, ConversationToolCall } from '@lingle/shared/types'
import type { Prisma } from '@prisma/client'

/**
 * Append user and/or assistant entries to a session's transcript in the DB.
 * Re-fetches the current transcript to avoid stale reads on concurrent messages.
 */
export async function persistTranscript(
  sessionId: string,
  userContent: string | null,
  assistantContent: string | null,
  toolCalls?: ConversationToolCall[],
): Promise<void> {
  const current = await prisma.conversationSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { transcript: true },
  })
  const transcript = (current.transcript as unknown as ConversationMessage[]) ?? []

  if (userContent) {
    transcript.push({
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString(),
    })
  }

  if (assistantContent || (toolCalls && toolCalls.length > 0)) {
    transcript.push({
      role: 'assistant',
      content: assistantContent || '',
      timestamp: new Date().toISOString(),
      ...(toolCalls && toolCalls.length > 0 ? { toolCalls } : {}),
    })
  }

  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: { transcript: transcript as unknown as Prisma.InputJsonValue },
  })
}
