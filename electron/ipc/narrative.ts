import { ipcMain } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { IPC_CHANNELS } from '@shared/types'
import type { FrontierData, TomBrief, NarrativeDraft } from '@shared/types'
import { buildNarrativeDraft } from '@core/narrative/draft'
import { buildPolishPrompt } from '@core/narrative/prompt'

const anthropic = new Anthropic()

export function registerNarrativeHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.NARRATIVE_BUILD_DRAFT,
    async (
      _event,
      frontier: FrontierData,
      brief: TomBrief | null
    ): Promise<NarrativeDraft> => {
      return buildNarrativeDraft(frontier, brief)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.NARRATIVE_POLISH,
    async (_event, draft: NarrativeDraft): Promise<string> => {
      const prompt = buildPolishPrompt(draft)

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      })

      const textContent = response.content.find((c) => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        return draft.templateText
      }

      return textContent.text
    }
  )
}
