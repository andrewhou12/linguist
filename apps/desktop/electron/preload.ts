import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/types'

// Build the API object from IPC_CHANNELS — each channel becomes an invoke wrapper
type LinguistApi = {
  [K in keyof typeof IPC_CHANNELS as Uncapitalize<
    K extends `${infer Domain}_${infer Rest}` ? `${Lowercase<Domain>}${Capitalize<Lowercase<Rest>>}` : Lowercase<K>
  >]: (...args: unknown[]) => Promise<unknown>
}

const api: Record<string, (...args: unknown[]) => Promise<unknown>> = {}

for (const [key, channel] of Object.entries(IPC_CHANNELS)) {
  // Convert REVIEW_GET_QUEUE → reviewGetQueue
  const camelKey = key
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

  api[camelKey] = (...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
}

// Chat streaming event listeners (typed in src/env.d.ts)
/* eslint-disable @typescript-eslint/no-explicit-any */
const streamListeners: Record<string, unknown> = {
  chatOnChunk(cb: (data: any) => void) {
    const handler = (_: any, data: any) => cb(data)
    ipcRenderer.on('chat:chunk', handler)
    return () => ipcRenderer.removeListener('chat:chunk', handler)
  },
  chatOnDone(cb: (data: any) => void) {
    const handler = (_: any, data: any) => cb(data)
    ipcRenderer.on('chat:done', handler)
    return () => ipcRenderer.removeListener('chat:done', handler)
  },
}
/* eslint-enable @typescript-eslint/no-explicit-any */

contextBridge.exposeInMainWorld('linguist', { ...api, ...streamListeners })
contextBridge.exposeInMainWorld('platform', process.platform)
