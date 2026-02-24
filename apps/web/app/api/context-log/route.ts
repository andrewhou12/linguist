import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')
  const itemType = searchParams.get('itemType')
  const contextType = searchParams.get('contextType')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const where: Record<string, unknown> = { userId }
  if (contextType) where.contextType = contextType
  if (itemId && itemType === 'lexical') where.lexicalItemId = parseInt(itemId)
  if (itemId && itemType === 'grammar') where.grammarItemId = parseInt(itemId)

  const logs = await prisma.itemContextLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
  })

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      contextType: l.contextType,
      modality: l.modality,
      wasProduction: l.wasProduction,
      wasSuccessful: l.wasSuccessful,
      contextQuote: l.contextQuote,
      sessionId: l.sessionId,
      timestamp: l.timestamp.toISOString(),
      lexicalItemId: l.lexicalItemId,
      grammarItemId: l.grammarItemId,
    }))
  )
})

export const POST = withAuth(async (request, { userId }) => {
  const data = await request.json()

  const log = await prisma.itemContextLog.create({
    data: {
      userId,
      contextType: data.contextType,
      modality: data.modality,
      wasProduction: data.wasProduction,
      wasSuccessful: data.wasSuccessful,
      contextQuote: data.contextQuote,
      sessionId: data.sessionId,
      lexicalItemId: data.lexicalItemId,
      grammarItemId: data.grammarItemId,
    },
  })

  // Update item context tracking
  if (data.lexicalItemId) {
    const item = await prisma.lexicalItem.findUnique({ where: { id: data.lexicalItemId } })
    if (item) {
      const updatedContextTypes = item.contextTypes.includes(data.contextType)
        ? item.contextTypes
        : [...item.contextTypes, data.contextType]
      await prisma.lexicalItem.update({
        where: { id: data.lexicalItemId },
        data: { contextTypes: updatedContextTypes, contextCount: updatedContextTypes.length },
      })
    }
  }
  if (data.grammarItemId) {
    const item = await prisma.grammarItem.findUnique({ where: { id: data.grammarItemId } })
    if (item) {
      const updatedContextTypes = item.contextTypes.includes(data.contextType)
        ? item.contextTypes
        : [...item.contextTypes, data.contextType]
      await prisma.grammarItem.update({
        where: { id: data.grammarItemId },
        data: { contextTypes: updatedContextTypes, contextCount: updatedContextTypes.length },
      })
    }
  }

  return NextResponse.json({
    id: log.id,
    contextType: log.contextType,
    modality: log.modality,
    wasProduction: log.wasProduction,
    wasSuccessful: log.wasSuccessful,
    contextQuote: log.contextQuote,
    sessionId: log.sessionId,
    timestamp: log.timestamp.toISOString(),
    lexicalItemId: log.lexicalItemId,
    grammarItemId: log.grammarItemId,
  })
})
