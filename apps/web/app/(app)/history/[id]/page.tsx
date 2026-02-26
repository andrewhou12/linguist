'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Box, Heading, Text, Flex, Badge, Button } from '@radix-ui/themes'
import { ArrowLeft, Clock } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ConversationMessage, ExpandedSessionPlan } from '@linguist/shared/types'
import { api } from '@/lib/api'
import { parseMessage, type MessageSegment } from '@/lib/message-parser'
import { VocabCard, GrammarCard, CorrectionCard, ReviewPromptCard } from '@/components/conversation-cards'
import { AnnotatedMessage, type Annotation } from '@/components/annotated-message'
import { SessionAnalysisPanel } from '@/components/session-analysis-panel'
import { Spinner } from '@/components/spinner'

type SessionDetail = Awaited<ReturnType<typeof api.conversationDetail>>

export default function SessionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.conversationDetail(id).then((data) => {
      setSession(data)
      setIsLoading(false)
    }).catch((err) => {
      console.error('Failed to load session:', err)
      setIsLoading(false)
    })
  }, [id])

  if (isLoading) {
    return (
      <Box style={{ maxWidth: 768, margin: '0 auto' }}>
        <Flex align="center" gap="2" py="4">
          <Spinner size={16} />
          <Text color="gray">Loading session...</Text>
        </Flex>
      </Box>
    )
  }

  if (!session) {
    return (
      <Box style={{ maxWidth: 768, margin: '0 auto' }}>
        <Text color="gray">Session not found.</Text>
      </Box>
    )
  }

  const transcript = (session.transcript ?? []) as ConversationMessage[]
  const plan = session.sessionPlan as ExpandedSessionPlan | null
  const targetsHit = (session.targetsHit ?? []) as number[]
  const errorsLogged = (session.errorsLogged ?? []) as Array<{ itemId: number; errorType: string; contextQuote: string }>
  const avoidanceEvents = (session.avoidanceEvents ?? []) as Array<{ itemId: number; contextQuote: string }>
  const targetsPlanned = (session.targetsPlanned ?? { vocabulary: [], grammar: [] }) as { vocabulary: number[]; grammar: number[] }

  const date = new Date(session.timestamp)
  const mins = session.durationSeconds ? Math.max(1, Math.round(session.durationSeconds / 60)) : null

  // Build annotation index: for each message, match context quotes
  function getAnnotationsForMessage(content: string): Annotation[] {
    const annotations: Annotation[] = []
    for (const id of targetsHit) {
      // Simple: mark target hit if content mentions the item
      annotations.push({ type: 'target_hit', label: `Target #${id}` })
    }
    for (const err of errorsLogged) {
      if (err.contextQuote && content.includes(err.contextQuote)) {
        annotations.push({ type: 'error', label: err.contextQuote })
      }
    }
    for (const ev of avoidanceEvents) {
      if (ev.contextQuote && content.includes(ev.contextQuote)) {
        annotations.push({ type: 'avoidance', label: ev.contextQuote })
      }
    }
    return annotations
  }

  return (
    <Box style={{ maxWidth: 768, margin: '0 auto' }}>
      {/* Header */}
      <Flex align="center" gap="3" mb="4">
        <Button variant="ghost" size="1" asChild>
          <Link href="/history">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <Flex direction="column">
          <Heading size="5">
            {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </Heading>
          <Flex align="center" gap="2">
            <Text size="2" color="gray">
              {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {mins && (
              <Flex align="center" gap="1">
                <Clock size={12} style={{ color: 'var(--gray-8)' }} />
                <Text size="2" color="gray">{mins}m</Text>
              </Flex>
            )}
            {plan && (
              <>
                <Badge size="1" variant="soft">{plan.difficultyLevel}</Badge>
                <Badge size="1" variant="outline" color="gray">{plan.register}</Badge>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>

      {plan?.sessionFocus && (
        <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
          {plan.sessionFocus}
        </Text>
      )}

      {/* Annotated Transcript */}
      <Box mb="4">
        {transcript.map((msg, i) => {
          // Only annotate the last few messages with actual matches
          const annotations = msg.role === 'user' ? [] : getAnnotationsForMessage(msg.content).filter(
            (a) => a.type === 'error' || a.type === 'avoidance'
          )

          if (msg.role === 'user') {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0' }}>
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
                  {msg.content}
                </div>
              </div>
            )
          }

          const segments = parseMessage(msg.content)
          return (
            <AnnotatedMessage key={i} annotations={annotations}>
              <div style={{ padding: '12px 0' }}>
                {segments.map((seg, j) => (
                  <SegmentRenderer key={j} segment={seg} />
                ))}
              </div>
            </AnnotatedMessage>
          )
        })}
      </Box>

      {/* Session Analysis */}
      <SessionAnalysisPanel
        targetsPlanned={targetsPlanned}
        targetsHit={targetsHit}
        errorsLogged={errorsLogged}
        avoidanceEvents={avoidanceEvents}
        durationSeconds={session.durationSeconds}
      />
    </Box>
  )
}

function SegmentRenderer({ segment }: { segment: MessageSegment }) {
  switch (segment.type) {
    case 'vocab_card':
      return <VocabCard segment={segment} />
    case 'grammar_card':
      return <GrammarCard segment={segment} />
    case 'correction':
      return <CorrectionCard segment={segment} />
    case 'review_prompt':
      return <ReviewPromptCard segment={segment} />
    case 'targets_hit':
      return null
    case 'text':
    default:
      if (!segment.content.trim()) return null
      return (
        <div className="chat-markdown" style={{ color: 'var(--gray-12)', lineHeight: 1.7, fontSize: 15 }}>
          <Markdown remarkPlugins={[remarkGfm]}>{segment.content}</Markdown>
        </div>
      )
  }
}
