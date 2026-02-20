import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type {
  KnowledgeBubble,
  CurriculumRecommendation,
  FsrsState,
  ItemType,
} from '@shared/types'
import type { Prisma } from '@prisma/client'
import { getDb } from '../db'
import { computeKnowledgeBubble } from '@core/curriculum/bubble'
import { generateRecommendations } from '@core/curriculum/recommender'
import { createInitialFsrsState } from '@core/fsrs/scheduler'
import { gatherBubbleItems } from './_helpers/gather-items'

export function registerCurriculumHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_GET_BUBBLE,
    async (): Promise<KnowledgeBubble> => {
      const items = await gatherBubbleItems()
      return computeKnowledgeBubble(items)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_GET_RECOMMENDATIONS,
    async (): Promise<CurriculumRecommendation[]> => {
      const db = getDb()
      const items = await gatherBubbleItems()
      const bubble = computeKnowledgeBubble(items)

      const lexicalItems = await db.lexicalItem.findMany()
      const grammarItems = await db.grammarItem.findMany()

      const knownSurfaceForms = new Set(lexicalItems.map((i) => i.surfaceForm))
      const knownPatternIds = new Set(grammarItems.map((i) => i.patternId))

      const profile = await db.learnerProfile.findUnique({ where: { id: 1 } })
      const dailyLimit = profile?.dailyNewItemLimit ?? 10

      const recommendations = generateRecommendations({
        bubble,
        knownSurfaceForms,
        knownPatternIds,
        dailyNewItemLimit: dailyLimit,
        tomBriefInput: null, // ToM brief computed separately when needed
      })

      // Store recommendations as CurriculumItems and attach DB ids
      for (const rec of recommendations) {
        const created = await db.curriculumItem.create({
          data: {
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

      return recommendations
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_INTRODUCE_ITEM,
    async (
      _event,
      curriculumItemId: number
    ): Promise<{ itemId: number; itemType: ItemType }> => {
      const db = getDb()

      const currItem = await db.curriculumItem.findUniqueOrThrow({
        where: { id: curriculumItemId },
      })

      const initialFsrs = createInitialFsrsState()

      if (currItem.itemType === 'lexical') {
        const created = await db.lexicalItem.create({
          data: {
            surfaceForm: currItem.surfaceForm ?? '',
            reading: currItem.reading,
            meaning: currItem.meaning ?? '',
            masteryState: 'introduced',
            recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
            productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
            source: 'curriculum',
            cefrLevel: currItem.cefrLevel,
            frequencyRank: currItem.frequencyRank,
            tags: ['curriculum'],
          },
        })

        await db.curriculumItem.update({
          where: { id: curriculumItemId },
          data: { status: 'introduced', introducedAt: new Date() },
        })

        return { itemId: created.id, itemType: 'lexical' }
      } else {
        const created = await db.grammarItem.create({
          data: {
            patternId: currItem.patternId ?? `grammar_${Date.now()}`,
            name: currItem.surfaceForm ?? currItem.patternId ?? '',
            description: currItem.meaning,
            cefrLevel: currItem.cefrLevel,
            masteryState: 'introduced',
            recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
            productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
            frequencyRank: currItem.frequencyRank,
          },
        })

        await db.curriculumItem.update({
          where: { id: curriculumItemId },
          data: { status: 'introduced', introducedAt: new Date() },
        })

        return { itemId: created.id, itemType: 'grammar' }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_SKIP_ITEM,
    async (_event, curriculumItemId: number): Promise<void> => {
      const db = getDb()
      await db.curriculumItem.update({
        where: { id: curriculumItemId },
        data: { status: 'skipped' },
      })
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_REGENERATE,
    async (): Promise<CurriculumRecommendation[]> => {
      const db = getDb()

      // Clear old queued items
      await db.curriculumItem.deleteMany({
        where: { status: 'queued' },
      })

      // Re-run the recommendation engine
      const items = await gatherBubbleItems()
      const bubble = computeKnowledgeBubble(items)

      const lexicalItems = await db.lexicalItem.findMany()
      const grammarItems = await db.grammarItem.findMany()

      const knownSurfaceForms = new Set(lexicalItems.map((i) => i.surfaceForm))
      const knownPatternIds = new Set(grammarItems.map((i) => i.patternId))

      const profile = await db.learnerProfile.findUnique({ where: { id: 1 } })
      const dailyLimit = profile?.dailyNewItemLimit ?? 10

      const recommendations = generateRecommendations({
        bubble,
        knownSurfaceForms,
        knownPatternIds,
        dailyNewItemLimit: dailyLimit,
        tomBriefInput: null,
      })

      for (const rec of recommendations) {
        const created = await db.curriculumItem.create({
          data: {
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

      return recommendations
    }
  )
}
