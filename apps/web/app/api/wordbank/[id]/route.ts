import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import { MasteryState } from '@linguist/shared/types'
import type { FsrsState, WordBankEntry } from '@linguist/shared/types'

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
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!)
  const item = await prisma.lexicalItem.findUnique({ where: { id } })
  return item ? NextResponse.json(toWordBankEntry(item)) : NextResponse.json(null)
})

export const PATCH = withAuth(async (request, { userId }) => {
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!)
  const data = await request.json()
  const item = await prisma.lexicalItem.update({
    where: { id },
    data: {
      ...(data.meaning !== undefined ? { meaning: data.meaning } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.masteryState !== undefined ? { masteryState: data.masteryState } : {}),
    },
  })
  return NextResponse.json(toWordBankEntry(item))
})
