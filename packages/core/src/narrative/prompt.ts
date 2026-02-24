import type { NarrativeDraft } from '@linguist/shared/types'

export function buildPolishPrompt(draft: NarrativeDraft): string {
  return [
    'You are a concise language learning coach. Rephrase the learner status below into 3-4 natural, encouraging sentences.',
    'Be specific — use the numbers provided. Do not be generic. Do not use emojis. Keep it under 60 words.',
    '',
    `Learner status: ${draft.templateText}`,
  ].join('\n')
}
