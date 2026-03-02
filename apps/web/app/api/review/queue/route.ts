import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import { computeReviewQueue } from '@lingle/core/fsrs/scheduler'
import type { FsrsState } from '@lingle/shared/types'
import { MasteryState } from '@lingle/shared/types'

const MAX_QUEUE_SIZE = 200

export const GET = withAuth(async (_request, { userId }) => {
  const lexicalItems = await prisma.lexicalItem.findMany({
    where: { userId, masteryState: { not: MasteryState.Unseen } },
  })

  const grammarItems = await prisma.grammarItem.findMany({
    where: { userId, masteryState: { not: MasteryState.Unseen } },
  })

  const allItems = [
    ...lexicalItems.map((item) => ({
      id: item.id,
      itemType: 'lexical' as const,
      surfaceForm: item.surfaceForm,
      reading: item.reading,
      meaning: item.meaning,
      masteryState: item.masteryState,
      recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
      productionFsrs: item.productionFsrs as unknown as FsrsState,
    })),
    ...grammarItems.map((item) => ({
      id: item.id,
      itemType: 'grammar' as const,
      surfaceForm: item.name,
      reading: null,
      meaning: item.description ?? item.name,
      masteryState: item.masteryState,
      recognitionFsrs: item.recognitionFsrs as unknown as FsrsState,
      productionFsrs: item.productionFsrs as unknown as FsrsState,
    })),
  ]

  const queue = computeReviewQueue(allItems)
  return NextResponse.json(queue.slice(0, MAX_QUEUE_SIZE))
})
