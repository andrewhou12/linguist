import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import { computeKnowledgeBubble, type BubbleItemInput } from '@linguist/core/curriculum/bubble'
import { generateRecommendations } from '@linguist/core/curriculum/recommender'

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '10')

  // Return existing queued items if any
  const existing = await prisma.curriculumItem.findMany({
    where: { userId, status: 'queued' },
    orderBy: { priority: 'desc' },
  })
  if (existing.length > 0) {
    return NextResponse.json(existing.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      surfaceForm: item.surfaceForm ?? undefined,
      reading: item.reading ?? undefined,
      meaning: item.meaning ?? undefined,
      patternId: item.patternId ?? undefined,
      cefrLevel: item.cefrLevel ?? undefined,
      frequencyRank: item.frequencyRank ?? undefined,
      priority: item.priority,
      reason: item.reason,
      prerequisitesMet: true,
    })))
  }

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
    dailyNewItemLimit: limit, tomBriefInput: null,
  })

  // Persist to CurriculumItem so the frontend gets IDs for skip/introduce
  for (const rec of recommendations) {
    const created = await prisma.curriculumItem.create({
      data: {
        userId,
        itemType: rec.itemType,
        surfaceForm: rec.surfaceForm,
        reading: rec.reading,
        meaning: rec.meaning,
        patternId: rec.patternId,
        cefrLevel: rec.cefrLevel,
        frequencyRank: rec.frequencyRank,
        priority: rec.priority,
        reason: rec.reason,
        status: 'queued',
      },
    })
    rec.id = created.id
  }

  return NextResponse.json(recommendations)
})
