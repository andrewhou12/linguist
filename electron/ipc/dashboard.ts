import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { FrontierData, FrontierItem, WeeklyStats } from '@shared/types'
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

  ipcMain.handle(
    IPC_CHANNELS.DASHBOARD_GET_WEEKLY_STATS,
    async (): Promise<WeeklyStats> => {
      log.info('dashboard:getWeeklyStats started')
      const db = getDb()

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)

      // Reviews this week
      const weeklyReviews = await db.reviewEvent.findMany({
        where: { timestamp: { gte: weekAgo } },
      })

      const correctCount = weeklyReviews.filter(
        (r) => r.grade === 'good' || r.grade === 'easy'
      ).length
      const accuracyThisWeek =
        weeklyReviews.length > 0 ? correctCount / weeklyReviews.length : 0

      // Conversation sessions this week
      const weeklySessions = await db.conversationSession.count({
        where: { timestamp: { gte: weekAgo } },
      })

      // Items that advanced past "introduced" this week (proxy: lastReviewed in the week + not unseen/introduced)
      const itemsLearned = await db.lexicalItem.count({
        where: {
          lastReviewed: { gte: weekAgo },
          masteryState: { notIn: ['unseen', 'introduced'] },
        },
      })

      // Streak from profile
      const profile = await db.learnerProfile.findUnique({ where: { id: 1 } })

      const stats: WeeklyStats = {
        reviewsThisWeek: weeklyReviews.length,
        accuracyThisWeek,
        sessionsThisWeek: weeklySessions,
        currentStreak: profile?.currentStreak ?? 0,
        longestStreak: profile?.longestStreak ?? 0,
        itemsLearned,
      }

      log.info('dashboard:getWeeklyStats completed', stats)
      return stats
    }
  )
}
