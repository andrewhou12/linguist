import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import { computeKnowledgeBubble, type BubbleItemInput } from '@linguist/core/curriculum/bubble'
import { generateRecommendations } from '@linguist/core/curriculum/recommender'

export const POST = withAuth(async (_request, { userId }) => {
  await prisma.curriculumItem.deleteMany({
    where: { userId, status: 'queued' },
  })

  const allLexical = await prisma.lexicalItem.findMany({ where: { userId } })
  const allGrammar = await prisma.grammarItem.findMany({ where: { userId } })

  const bubbleItems: BubbleItemInput[] = [
    ...allLexical.map((i) => ({
      id: i.id, itemType: 'lexical' as const, surfaceForm: i.surfaceForm,
      cefrLevel: i.cefrLevel, masteryState: i.masteryState, productionWeight: i.productionWeight,
    })),
    ...allGrammar.map((i) => ({
      id: i.id, itemType: 'grammar' as const, patternId: i.patternId,
      cefrLevel: i.cefrLevel, masteryState: i.masteryState, productionWeight: i.productionWeight,
    })),
  ]

  const bubble = computeKnowledgeBubble(bubbleItems)
  const knownSurfaceForms = new Set(allLexical.map((i) => i.surfaceForm))
  const knownPatternIds = new Set(allGrammar.map((i) => i.patternId))

  const recommendations = generateRecommendations({
    bubble, knownSurfaceForms, knownPatternIds,
    dailyNewItemLimit: 10, tomBriefInput: null,
  })

  return NextResponse.json(recommendations)
})
