import type {
  ConversationMessage,
  PostSessionAnalysis,
  ExpandedPostSessionAnalysis,
  ExpandedSessionPlan,
  ContextType,
  LearningModality,
  ItemType,
} from '@shared/types'

export function buildAnalysisPrompt(
  transcript: ConversationMessage[],
  plan: ExpandedSessionPlan
): string {
  return `Analyze this conversation transcript and return JSON.

Session plan:
${JSON.stringify(plan, null, 2)}

Transcript:
${transcript.map((m) => `[${m.role}] ${m.content}`).join('\n')}

Analyze the LEARNER's messages (role: "user") for:
1. Which target items were successfully produced by the learner
2. Errors made by the learner (wrong word, wrong grammar, wrong reading)
3. Avoidance events where the learner avoided target items despite opportunity
4. New items the learner encountered for the first time
5. Register accuracy: did the learner maintain the target register (${plan.pragmaticTargets.targetRegister})?
6. Communication strategies: circumlocution (talking around unknown words), L1 fallbacks (switching to native language), silence/avoidance
7. Per-item context logs: for each item the learner interacted with, what modality and context

Respond with ONLY valid JSON matching this schema:
{
  "targets_hit": [item_ids],
  "errors_logged": [{ "item_id": number, "error_type": string, "context_quote": string }],
  "avoidance_events": [{ "item_id": number, "context_quote": string }],
  "new_items_encountered": [{ "surface_form": string, "context_quote": string }],
  "overall_assessment": "one sentence",
  "register_accuracy": {
    "correct_register_uses": number,
    "register_slips": number,
    "target_register": "${plan.pragmaticTargets.targetRegister}"
  },
  "strategy_events": {
    "circumlocutions": [{ "context_quote": string, "target_item": string | null }],
    "l1_fallbacks": [{ "context_quote": string, "intended_meaning": string | null }],
    "silence_events": number
  },
  "context_logs": [{
    "item_id": number,
    "item_type": "lexical" | "grammar",
    "context_type": "conversation",
    "modality": "reading" | "writing" | "speaking" | "listening",
    "was_production": boolean,
    "was_successful": boolean
  }]
}`
}

export function parseAnalysis(raw: string): ExpandedPostSessionAnalysis {
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
    registerAccuracy: {
      correctRegisterUses: parsed.register_accuracy?.correct_register_uses ?? 0,
      registerSlips: parsed.register_accuracy?.register_slips ?? 0,
      targetRegister: parsed.register_accuracy?.target_register ?? 'polite',
    },
    strategyEvents: {
      circumlocutions: (parsed.strategy_events?.circumlocutions ?? []).map(
        (c: { context_quote: string; target_item?: string }) => ({
          contextQuote: c.context_quote,
          targetItem: c.target_item ?? undefined,
        })
      ),
      l1Fallbacks: (parsed.strategy_events?.l1_fallbacks ?? []).map(
        (f: { context_quote: string; intended_meaning?: string }) => ({
          contextQuote: f.context_quote,
          intendedMeaning: f.intended_meaning ?? undefined,
        })
      ),
      silenceEvents: parsed.strategy_events?.silence_events ?? 0,
    },
    contextLogs: (parsed.context_logs ?? []).map(
      (l: {
        item_id: number
        item_type: string
        context_type: string
        modality: string
        was_production: boolean
        was_successful: boolean
      }) => ({
        itemId: l.item_id,
        itemType: l.item_type as ItemType,
        contextType: (l.context_type ?? 'conversation') as ContextType,
        modality: (l.modality ?? 'writing') as LearningModality,
        wasProduction: l.was_production ?? false,
        wasSuccessful: l.was_successful ?? false,
      })
    ),
  }
}
