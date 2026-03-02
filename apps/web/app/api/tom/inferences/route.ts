import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@lingle/db'

export const GET = withAuth(async (_request, { userId }) => {
  const inferences = await prisma.tomInference.findMany({
    where: { userId, resolved: false },
    orderBy: { lastUpdated: 'desc' },
  })

  return NextResponse.json(
    inferences.map((i) => ({
      id: i.id,
      type: i.type,
      itemIds: i.itemIds,
      confidence: i.confidence,
      description: i.description,
      resolved: i.resolved,
    }))
  )
})
