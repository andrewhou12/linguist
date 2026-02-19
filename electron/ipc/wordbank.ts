import { ipcMain } from 'electron'
import { IPC_CHANNELS, MasteryState } from '@shared/types'
import type { WordBankEntry, WordBankFilters, FsrsState } from '@shared/types'
import type { Prisma } from '@prisma/client'
import { getDb } from '../db'
import { createInitialFsrsState } from '@core/fsrs/scheduler'

export function registerWordbankHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.WORDBANK_LIST,
    async (_event, filters?: WordBankFilters): Promise<WordBankEntry[]> => {
      const db = getDb()

      const where: Record<string, unknown> = {}
      if (filters?.masteryState) {
        where.masteryState = filters.masteryState
      }
      if (filters?.tag) {
        where.tags = { has: filters.tag }
      }
      if (filters?.dueOnly) {
        where.OR = [
          { recognitionFsrs: { path: ['due'], lte: new Date().toISOString() } },
          { productionFsrs: { path: ['due'], lte: new Date().toISOString() } },
        ]
      }

      const items = await db.lexicalItem.findMany({ where, orderBy: { firstSeen: 'desc' } })

      return items.map(toWordBankEntry)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.WORDBANK_GET,
    async (_event, id: number): Promise<WordBankEntry | null> => {
      const db = getDb()
      const item = await db.lexicalItem.findUnique({ where: { id } })
      return item ? toWordBankEntry(item) : null
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.WORDBANK_ADD,
    async (
      _event,
      data: { surfaceForm: string; reading?: string; meaning: string; partOfSpeech?: string; tags?: string[] }
    ): Promise<WordBankEntry> => {
      const db = getDb()
      const initialFsrs = createInitialFsrsState()

      const item = await db.lexicalItem.create({
        data: {
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

      return toWordBankEntry(item)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.WORDBANK_UPDATE,
    async (
      _event,
      id: number,
      data: { meaning?: string; tags?: string[]; masteryState?: string }
    ): Promise<WordBankEntry> => {
      const db = getDb()
      const item = await db.lexicalItem.update({
        where: { id },
        data: {
          ...(data.meaning !== undefined ? { meaning: data.meaning } : {}),
          ...(data.tags !== undefined ? { tags: data.tags } : {}),
          ...(data.masteryState !== undefined ? { masteryState: data.masteryState } : {}),
        },
      })
      return toWordBankEntry(item)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.WORDBANK_SEARCH,
    async (_event, query: string): Promise<WordBankEntry[]> => {
      const db = getDb()
      const items = await db.lexicalItem.findMany({
        where: {
          OR: [
            { surfaceForm: { contains: query, mode: 'insensitive' } },
            { reading: { contains: query, mode: 'insensitive' } },
            { meaning: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { firstSeen: 'desc' },
      })
      return items.map(toWordBankEntry)
    }
  )
}

function toWordBankEntry(item: {
  id: number
  surfaceForm: string
  reading: string | null
  meaning: string
  partOfSpeech: string | null
  masteryState: string
  recognitionFsrs: unknown
  productionFsrs: unknown
  firstSeen: Date
  lastReviewed: Date | null
  exposureCount: number
  productionCount: number
  tags: string[]
  source: string
}): WordBankEntry {
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
