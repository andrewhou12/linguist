import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import type { PragmaticState } from '@lingle/shared/types'

function toPragmaticState(p: any): PragmaticState {
  return {
    casualAccuracy: p.casualAccuracy,
    politeAccuracy: p.politeAccuracy,
    registerSlipCount: p.registerSlipCount,
    preferredRegister: p.preferredRegister,
    circumlocutionCount: p.circumlocutionCount,
    silenceEvents: p.silenceEvents,
    l1FallbackCount: p.l1FallbackCount,
    averageSpeakingPace: p.averageSpeakingPace,
    hesitationRate: p.hesitationRate,
    avoidedGrammarPatterns: p.avoidedGrammarPatterns,
    avoidedVocabIds: p.avoidedVocabIds,
  }
}

export const GET = withAuth(async (_request, { userId }) => {
  let profile = await prisma.pragmaticProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.pragmaticProfile.create({
      data: { userId, preferredRegister: 'polite' },
    })
  }
  return NextResponse.json(toPragmaticState(profile))
})

export const PATCH = withAuth(async (request, { userId }) => {
  const updates = await request.json()
  const profile = await prisma.pragmaticProfile.upsert({
    where: { userId },
    create: { userId, ...updates },
    update: updates,
  })
  return NextResponse.json(toPragmaticState(profile))
})
