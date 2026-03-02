import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'
import { computeKnowledgeBubble, type BubbleItemInput } from '@lingle/core/curriculum/bubble'

export const GET = withAuth(async (_request, { userId }) => {
  const allLexical = await prisma.lexicalItem.findMany({ where: { userId } })
  const allGrammar = await prisma.grammarItem.findMany({ where: { userId } })

  const bubbleItems: BubbleItemInput[] = [
    ...allLexical.map((i) => ({
      id: i.id,
      itemType: 'lexical' as const,
      surfaceForm: i.surfaceForm,
      cefrLevel: i.cefrLevel,
      masteryState: i.masteryState,
      productionWeight: i.productionWeight,
    })),
    ...allGrammar.map((i) => ({
      id: i.id,
      itemType: 'grammar' as const,
      patternId: i.patternId,
      cefrLevel: i.cefrLevel,
      masteryState: i.masteryState,
      productionWeight: i.productionWeight,
    })),
  ]

  return NextResponse.json(computeKnowledgeBubble(bubbleItems))
})
