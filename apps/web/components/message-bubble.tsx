import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@linguist/shared/types'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end py-1.5">
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-gray-200 text-gray-900 leading-relaxed text-[15px] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="py-3">
      <div className="chat-markdown text-gray-900 leading-relaxed text-[15px]">
        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        {isStreaming && <span className="blink-cursor" />}
      </div>
    </div>
  )
}
