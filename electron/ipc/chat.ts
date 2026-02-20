import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { IPC_CHANNELS } from '@shared/types'
import type { ChatMessage } from '@shared/types'

const activeStreams = new Map<string, AbortController>()

export function registerChatHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND,
    async (event: IpcMainInvokeEvent, conversationId: string, messages: ChatMessage[]) => {
      // Abort any existing stream for this conversation
      const existing = activeStreams.get(conversationId)
      if (existing) existing.abort()

      const controller = new AbortController()
      activeStreams.set(conversationId, controller)

      try {
        const result = streamText({
          model: anthropic('claude-sonnet-4-20250514'),
          messages,
          maxOutputTokens: 4096,
          abortSignal: controller.signal,
        })

        for await (const delta of result.textStream) {
          if (controller.signal.aborted) break
          if (!event.sender.isDestroyed()) {
            event.sender.send('chat:chunk', { conversationId, delta })
          }
        }

        if (!event.sender.isDestroyed()) {
          event.sender.send('chat:done', { conversationId })
        }
      } catch (err: unknown) {
        if (!event.sender.isDestroyed()) {
          if (err instanceof Error && err.name === 'AbortError') {
            event.sender.send('chat:done', { conversationId })
          } else {
            const message = err instanceof Error ? err.message : 'Unknown error'
            event.sender.send('chat:done', { conversationId, error: message })
          }
        }
      } finally {
        activeStreams.delete(conversationId)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CHAT_STOP,
    async (_event: IpcMainInvokeEvent, conversationId: string) => {
      const controller = activeStreams.get(conversationId)
      if (controller) {
        controller.abort()
        activeStreams.delete(conversationId)
      }
    }
  )
}
