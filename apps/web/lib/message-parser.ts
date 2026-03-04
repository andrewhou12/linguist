export type MessageSegmentType = 'text' | 'correction'

export interface MessageSegment {
  type: MessageSegmentType
  content: string
  data?: Record<string, string>
}

const CORRECTION_REGEX = /\[CORRECTION\]([\s\S]*?)\[\/CORRECTION\]/g

function stripRuby(text: string): string {
  return text.replace(/\{([^}|]+)\|[^}]+\}/g, '$1')
}

function parseKeyValueBlock(content: string): Record<string, string> {
  const data: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*(\w+(?:_\w+)*):\s*(.+)$/)
    if (match) {
      data[match[1].trim()] = stripRuby(match[2].trim())
    }
  }
  return data
}

export function parseMessage(content: string): MessageSegment[] {
  const segments: MessageSegment[] = []
  let lastIndex = 0

  const matches = [...content.matchAll(CORRECTION_REGEX)]

  for (const match of matches) {
    const beforeText = content.slice(lastIndex, match.index).trim()
    if (beforeText) {
      segments.push({ type: 'text', content: beforeText })
    }

    segments.push({
      type: 'correction',
      content: match[1].trim(),
      data: parseKeyValueBlock(match[1]),
    })

    lastIndex = (match.index ?? 0) + match[0].length
  }

  const remaining = content.slice(lastIndex).trim()
  if (remaining) {
    segments.push({ type: 'text', content: remaining })
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content: '' })
  }

  return segments
}
