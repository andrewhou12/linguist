import type {
  ConversationMessage,
  PostSessionAnalysis,
  SessionPlan,
} from '@shared/types'

export function buildAnalysisPrompt(
  transcript: ConversationMessage[],
  plan: SessionPlan
): string {
  return `Analyze this conversation transcript and return JSON:
{
  "targets_hit": [item IDs successfully produced by the learner],
  "errors_logged": [{ "item_id": number, "error_type": string, "context_quote": string }],
  "avoidance_events": [{ "item_id": number, "context_quote": string }],
  "new_items_encountered": [{ "surface_form": string, "context_quote": string }],
  "overall_assessment": "one sentence"
}

Session plan:
${JSON.stringify(plan, null, 2)}

Transcript:
${transcript.map((m) => `[${m.role}] ${m.content}`).join('\n')}

Respond with only valid JSON.`
}

export function parseAnalysis(raw: string): PostSessionAnalysis {
  const parsed = JSON.parse(raw)
  return {
    targetsHit: parsed.targets_hit ?? [],
    errorsLogged: (parsed.errors_logged ?? []).map(
      (e: { item_id: number; error_type: string; context_quote: string }) => ({
        itemId: e.item_id,
        errorType: e.error_type,
        contextQuote: e.context_quote,
      })
    ),
    avoidanceEvents: (parsed.avoidance_events ?? []).map(
      (a: { item_id: number; context_quote: string }) => ({
        itemId: a.item_id,
        contextQuote: a.context_quote,
      })
    ),
    newItemsEncountered: (parsed.new_items_encountered ?? []).map(
      (n: { surface_form: string; context_quote: string }) => ({
        surfaceForm: n.surface_form,
        contextQuote: n.context_quote,
      })
    ),
    overallAssessment: parsed.overall_assessment ?? '',
  }
}
