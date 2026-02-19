import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { ConversationMessage, SessionPlan } from '@shared/types'
import { getDb } from '../db'

export function registerConversationHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_PLAN,
    async (): Promise<SessionPlan> => {
      // TODO: integrate with Claude API for session planning
      // For now, return a stub plan
      return {
        targetVocabulary: [],
        targetGrammar: [],
        difficultyLevel: 'N5',
        register: 'polite',
        sessionFocus: 'General conversation practice',
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_SEND,
    async (
      _event,
      sessionId: string,
      message: string
    ): Promise<ConversationMessage> => {
      // TODO: integrate with Claude API for conversation
      // For now, return a stub response
      return {
        role: 'assistant',
        content: `[Conversation stub] Received: ${message}`,
        timestamp: new Date().toISOString(),
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_END,
    async (_event, sessionId: string): Promise<void> => {
      const db = getDb()

      // Update session duration
      const session = await db.conversationSession.findUnique({
        where: { id: sessionId },
      })

      if (session) {
        const duration = Math.floor(
          (Date.now() - session.timestamp.getTime()) / 1000
        )
        await db.conversationSession.update({
          where: { id: sessionId },
          data: { durationSeconds: duration },
        })
      }

      // TODO: run post-session analysis via Claude API
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_LIST,
    async (): Promise<
      Array<{ id: string; timestamp: string; durationSeconds: number | null; sessionFocus: string }>
    > => {
      const db = getDb()
      const sessions = await db.conversationSession.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
      })

      return sessions.map((s) => ({
        id: s.id,
        timestamp: s.timestamp.toISOString(),
        durationSeconds: s.durationSeconds,
        sessionFocus: (s.sessionPlan as { sessionFocus?: string })?.sessionFocus ?? '',
      }))
    }
  )
}
