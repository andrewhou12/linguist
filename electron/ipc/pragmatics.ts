import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { PragmaticState } from '@shared/types'
import { getDb } from '../db'

export function registerPragmaticHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.PRAGMATIC_GET_STATE,
    async (): Promise<PragmaticState> => {
      const db = getDb()

      // Upsert: create default if not exists
      const profile = await db.pragmaticProfile.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
      })

      return {
        casualAccuracy: profile.casualAccuracy,
        politeAccuracy: profile.politeAccuracy,
        registerSlipCount: profile.registerSlipCount,
        preferredRegister: profile.preferredRegister,
        circumlocutionCount: profile.circumlocutionCount,
        silenceEvents: profile.silenceEvents,
        l1FallbackCount: profile.l1FallbackCount,
        averageSpeakingPace: profile.averageSpeakingPace,
        hesitationRate: profile.hesitationRate,
        avoidedGrammarPatterns: profile.avoidedGrammarPatterns,
        avoidedVocabIds: profile.avoidedVocabIds,
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PRAGMATIC_UPDATE,
    async (_event, state: PragmaticState): Promise<PragmaticState> => {
      const db = getDb()

      const updated = await db.pragmaticProfile.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          casualAccuracy: state.casualAccuracy,
          politeAccuracy: state.politeAccuracy,
          registerSlipCount: state.registerSlipCount,
          preferredRegister: state.preferredRegister,
          circumlocutionCount: state.circumlocutionCount,
          silenceEvents: state.silenceEvents,
          l1FallbackCount: state.l1FallbackCount,
          averageSpeakingPace: state.averageSpeakingPace,
          hesitationRate: state.hesitationRate,
          avoidedGrammarPatterns: state.avoidedGrammarPatterns,
          avoidedVocabIds: state.avoidedVocabIds,
        },
        update: {
          casualAccuracy: state.casualAccuracy,
          politeAccuracy: state.politeAccuracy,
          registerSlipCount: state.registerSlipCount,
          preferredRegister: state.preferredRegister,
          circumlocutionCount: state.circumlocutionCount,
          silenceEvents: state.silenceEvents,
          l1FallbackCount: state.l1FallbackCount,
          averageSpeakingPace: state.averageSpeakingPace,
          hesitationRate: state.hesitationRate,
          avoidedGrammarPatterns: state.avoidedGrammarPatterns,
          avoidedVocabIds: state.avoidedVocabIds,
        },
      })

      return {
        casualAccuracy: updated.casualAccuracy,
        politeAccuracy: updated.politeAccuracy,
        registerSlipCount: updated.registerSlipCount,
        preferredRegister: updated.preferredRegister,
        circumlocutionCount: updated.circumlocutionCount,
        silenceEvents: updated.silenceEvents,
        l1FallbackCount: updated.l1FallbackCount,
        averageSpeakingPace: updated.averageSpeakingPace,
        hesitationRate: updated.hesitationRate,
        avoidedGrammarPatterns: updated.avoidedGrammarPatterns,
        avoidedVocabIds: updated.avoidedVocabIds,
      }
    }
  )
}
