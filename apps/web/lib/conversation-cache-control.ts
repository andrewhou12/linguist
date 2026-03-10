export const MAX_CONVERSATION_MESSAGES = 20

/**
 * Truncate a message array to the most recent `limit` entries.
 * Returns the (possibly sliced) array and whether truncation occurred.
 */
export function truncateMessages<T>(
  messages: T[],
  limit?: number,
): { messages: T[]; truncated: boolean } {
  if (!limit || messages.length <= limit) {
    return { messages, truncated: false }
  }
  return { messages: messages.slice(-limit), truncated: true }
}

/**
 * Apply an Anthropic ephemeral cache breakpoint to the second-to-last message.
 * Mutates in-place. Works with both AI SDK model messages and plain {role, content} objects.
 * If content is an array, also sets the breakpoint on its last part.
 */
export function applyCacheBreakpoint(messages: unknown[]): void {
  if (messages.length < 3) return

  const target = messages[messages.length - 2] as {
    providerOptions?: Record<string, unknown>
    content?: unknown
  }

  if (!target.providerOptions) target.providerOptions = {}
  target.providerOptions.anthropic = { cacheControl: { type: 'ephemeral' } }

  const content = target.content
  if (Array.isArray(content) && content.length > 0) {
    const lastPart = content[content.length - 1] as {
      providerOptions?: Record<string, unknown>
    }
    if (!lastPart.providerOptions) lastPart.providerOptions = {}
    lastPart.providerOptions.anthropic = { cacheControl: { type: 'ephemeral' } }
  }
}
