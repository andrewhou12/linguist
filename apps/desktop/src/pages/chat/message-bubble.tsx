import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@shared/types'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0' }}>
        <div
          style={{
            maxWidth: '75%',
            padding: '10px 16px',
            borderRadius: 20,
            backgroundColor: 'var(--gray-3)',
            color: 'var(--gray-12)',
            lineHeight: 1.6,
            fontSize: 15,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <div
        className="chat-markdown"
        style={{
          color: 'var(--gray-12)',
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        {isStreaming && <span className="blink-cursor" />}
      </div>
    </div>
  )
}
