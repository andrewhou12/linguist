import { ipcMain } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { IPC_CHANNELS } from '@shared/types'
import type { FrontierData, TomBrief, NarrativeDraft } from '@shared/types'
import { buildNarrativeDraft } from '@core/narrative/draft'
import { buildPolishPrompt } from '@core/narrative/prompt'
import { createLogger } from '../logger'

const log = createLogger('ipc:narrative')
const anthropic = new Anthropic()

export function registerNarrativeHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.NARRATIVE_BUILD_DRAFT,
    async (
      _event,
      frontier: FrontierData,
      brief: TomBrief | null
    ): Promise<NarrativeDraft> => {
      log.info('narrative:buildDraft started')
      const draft = buildNarrativeDraft(frontier, brief)
      log.info('narrative:buildDraft completed', { templateLength: draft.templateText.length })
      return draft
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.NARRATIVE_POLISH,
    async (_event, draft: NarrativeDraft): Promise<string> => {
      log.info('narrative:polish started')
      const prompt = buildPolishPrompt(draft)

      const apiTimer = log.timer()
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      })
      log.info('API call: narrative polish', { model: 'claude-haiku-4-5-20251001', elapsedMs: apiTimer() })

      const textContent = response.content.find((c) => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        log.warn('narrative:polish - no text response, using template')
        return draft.templateText
      }

      log.info('narrative:polish completed', { responseLength: textContent.text.length })
      return textContent.text
    }
  )
}
