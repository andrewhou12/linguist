import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import { createInitialFsrsState } from '@lingle/core/fsrs/scheduler'
import type { Prisma } from '@prisma/client'

export const POST = withAuth(async (request, { userId }) => {
  const { curriculumItemId } = await request.json()
  const ci = await prisma.curriculumItem.findUniqueOrThrow({ where: { id: curriculumItemId } })

  const initialFsrs = createInitialFsrsState()

  if (ci.itemType === 'lexical') {
    const item = await prisma.lexicalItem.create({
      data: {
        userId,
        surfaceForm: ci.surfaceForm ?? '',
        reading: ci.reading,
        meaning: ci.meaning ?? '',
        masteryState: 'introduced',
        recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
        productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
        cefrLevel: ci.cefrLevel,
        frequencyRank: ci.frequencyRank,
        source: 'curriculum',
        tags: ['curriculum'],
      },
    })
    await prisma.curriculumItem.update({
      where: { id: curriculumItemId },
      data: { status: 'introduced', introducedAt: new Date(), referenceItemId: item.id },
    })
    return NextResponse.json({ itemId: item.id, itemType: 'lexical' })
  } else {
    const item = await prisma.grammarItem.create({
      data: {
        userId,
        patternId: ci.patternId ?? `grammar-${Date.now()}`,
        name: ci.surfaceForm ?? ci.meaning ?? '',
        description: ci.meaning,
        masteryState: 'introduced',
        recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
        productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
        cefrLevel: ci.cefrLevel,
        frequencyRank: ci.frequencyRank,
      },
    })
    await prisma.curriculumItem.update({
      where: { id: curriculumItemId },
      data: { status: 'introduced', introducedAt: new Date(), referenceItemId: item.id },
    })
    return NextResponse.json({ itemId: item.id, itemType: 'grammar' })
  }
})
