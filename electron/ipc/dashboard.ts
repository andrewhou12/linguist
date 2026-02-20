import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { FrontierData, FrontierItem } from '@shared/types'
import { getDb } from '../db'
import { computeKnowledgeBubble } from '@core/curriculum/bubble'
import { gatherBubbleItems, toExpandedProfile } from './_helpers/gather-items'
import { createLogger } from '../logger'

const log = createLogger('ipc:dashboard')

export function registerDashboardHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.DASHBOARD_GET_FRONTIER,
    async (): Promise<FrontierData | null> => {
      log.info('dashboard:getFrontier started')
      const db = getDb()

      const profile = await db.learnerProfile.findUnique({ where: { id: 1 } })
      if (!profile) {
        log.warn('dashboard:getFrontier - no profile found')
        return null
      }

      const bubbleItems = await gatherBubbleItems()
      const bubble = computeKnowledgeBubble(bubbleItems)

      const items: FrontierItem[] = bubbleItems.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        surfaceForm: item.surfaceForm,
        patternId: item.patternId,
        cefrLevel: item.cefrLevel,
        masteryState: item.masteryState,
      }))

      const masteryDistribution: Record<string, number> = {}
      for (const item of items) {
        masteryDistribution[item.masteryState] =
          (masteryDistribution[item.masteryState] ?? 0) + 1
      }

      log.info('dashboard:getFrontier completed', {
        totalItems: items.length,
        currentLevel: bubble.currentLevel,
        masteryDistribution,
      })

      return {
        bubble,
        profile: toExpandedProfile(profile),
        items,
        masteryDistribution,
      }
    }
  )
}
