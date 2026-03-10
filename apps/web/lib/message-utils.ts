import type { UIMessage } from 'ai'

/**
 * Extract joined text from an array of message parts.
 */
export function extractTextFromParts(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text!)
    .join('')
}

/**
 * Extract joined text from a UIMessage's parts.
 */
export function extractTextFromMessage(msg: UIMessage): string {
  return msg.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('')
}
