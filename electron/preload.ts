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

contextBridge.exposeInMainWorld('linguist', api)
