'use client'

import type { AnnotatedToken } from '@/hooks/use-living-text'
import { VocabToken } from '@/components/chat/vocab-token'
import { VocabPopover } from '@/components/chat/vocab-popover'

interface LivingTextProps {
  tokens: AnnotatedToken[]
}

export function LivingText({ tokens }: LivingTextProps) {
  return (
    <div className="chat-markdown text-text-primary leading-[1.7] text-[14.5px] font-jp">
      {tokens.map((token, i) => {
        // Non-content words (particles, punctuation, etc.) render plain
        if (!token.isContentWord) {
          return <span key={i}>{token.surface}</span>
        }

        // Content words get mastery-tier underlines + click popover
        return (
          <VocabPopover
            key={i}
            surface={token.surface}
            reading={token.reading}
            meaning={token.baseForm !== token.surface ? token.baseForm : undefined}
            tier={token.tier}
          >
            <VocabToken
              surface={token.surface}
              reading={token.reading}
              tier={token.tier}
            />
          </VocabPopover>
        )
      })}
    </div>
  )
}
