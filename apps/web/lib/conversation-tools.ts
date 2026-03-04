import { tool, jsonSchema } from 'ai'

const suggestResponsesSchema = jsonSchema<{
  suggestions: string[]
}>({
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: { type: 'string' },
      description: '2-3 contextual response suggestions in the target language that the learner could say next',
    },
  },
  required: ['suggestions'],
})

export function createConversationTools(_userId: string, _sessionId: string) {
  return {
    suggestResponses: tool({
      description:
        'Suggest 2-3 contextual responses the learner could say next. Call this at the end of every response.',
      inputSchema: suggestResponsesSchema,
      execute: async ({ suggestions }) => {
        return { suggestions }
      },
    }),
  }
}

export type ConversationTools = ReturnType<typeof createConversationTools>
