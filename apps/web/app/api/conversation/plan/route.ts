import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import type { Prisma } from '@prisma/client'

// Note: targetsPlanned, targetsHit, errorsLogged, avoidanceEvents are legacy schema
// fields with defaults. We pass empty values since the schema hasn't been migrated.

export const POST = withAuth(async (request, { userId }) => {
  let topicHint: string | undefined
  try {
    const body = await request.json()
    if (body.topicHint && typeof body.topicHint === 'string') {
      topicHint = body.topicHint
    }
  } catch {
    // No body or invalid JSON
  }

  const profile = await prisma.learnerProfile.findUniqueOrThrow({ where: { userId } })

  const sessionFocus = topicHint || 'Free conversation'

  const systemPrompt = `You are a language conversation partner for a ${profile.targetLanguage} learner.

LEARNER PROFILE:
- Native language: ${profile.nativeLanguage}
${topicHint ? `- Topic: ${topicHint}` : ''}

BEHAVIORAL RULES:
1. Speak primarily in ${profile.targetLanguage} at an appropriate difficulty level.
2. Create natural conversational moments for practice.
3. When the learner makes an error, correct via recasting: use the correct form naturally in your next utterance.
4. If the learner uses their native language, note it and gently redirect.
5. Keep responses concise and conversational.`

  const session = await prisma.conversationSession.create({
    data: {
      userId,
      transcript: [],
      targetsPlanned: {},
      targetsHit: [],
      errorsLogged: [],
      avoidanceEvents: [],
      sessionPlan: { sessionFocus } as unknown as Prisma.InputJsonValue,
      systemPrompt,
    },
  })

  await prisma.learnerProfile.update({
    where: { userId },
    data: { totalSessions: { increment: 1 } },
  })

  return NextResponse.json({ _sessionId: session.id, sessionFocus })
})
