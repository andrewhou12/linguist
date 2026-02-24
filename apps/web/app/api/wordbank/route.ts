import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import { createInitialFsrsState } from '@linguist/core/fsrs/scheduler'
import { MasteryState } from '@linguist/shared/types'
import type { FsrsState, WordBankEntry } from '@linguist/shared/types'
import type { Prisma } from '@prisma/client'

function toWordBankEntry(item: any): WordBankEntry {
  return {
    id: item.id,
    surfaceForm: item.surfaceForm,
    reading: item.reading,
    meaning: item.meaning,
    partOfSpeech: item.partOfSpeech,
    masteryState: item.masteryState as MasteryState,
    recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
    productionFsrs: item.productionFsrs as unknown as FsrsState,
    firstSeen: item.firstSeen.toISOString(),
    lastReviewed: item.lastReviewed?.toISOString() ?? null,
    exposureCount: item.exposureCount,
    productionCount: item.productionCount,
    tags: item.tags,
    source: item.source,
  }
}

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url)
  const masteryState = searchParams.get('masteryState')
  const tag = searchParams.get('tag')
  const dueOnly = searchParams.get('dueOnly') === 'true'

  const where: Record<string, unknown> = { userId }
  if (masteryState) where.masteryState = masteryState
  if (tag) where.tags = { has: tag }
  if (dueOnly) {
    where.OR = [
      { recognitionFsrs: { path: ['due'], lte: new Date().toISOString() } },
      { productionFsrs: { path: ['due'], lte: new Date().toISOString() } },
    ]
  }

  const items = await prisma.lexicalItem.findMany({ where, orderBy: { firstSeen: 'desc' } })
  return NextResponse.json(items.map(toWordBankEntry))
})

export const POST = withAuth(async (request, { userId }) => {
  const data = await request.json()
  const initialFsrs = createInitialFsrsState()

  const item = await prisma.lexicalItem.create({
    data: {
      userId,
      surfaceForm: data.surfaceForm,
      reading: data.reading,
      meaning: data.meaning,
      partOfSpeech: data.partOfSpeech,
      recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
      productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
      tags: data.tags ?? [],
      source: 'manual',
    },
  })

  return NextResponse.json(toWordBankEntry(item))
})
