import { NextResponse } from 'next/server'
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
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

  const items = await prisma.lexicalItem.findMany({
    where: {
      userId,
      OR: [
        { surfaceForm: { contains: query, mode: 'insensitive' } },
        { reading: { contains: query, mode: 'insensitive' } },
        { meaning: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { firstSeen: 'desc' },
  })
  return NextResponse.json(items.map(toWordBankEntry))
})
