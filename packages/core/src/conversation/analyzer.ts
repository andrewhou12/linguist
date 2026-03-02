import type {
  ConversationMessage,
  PostSessionAnalysis,
  ExpandedPostSessionAnalysis,
  ExpandedSessionPlan,
  ContextType,
  LearningModality,
  ItemType,
} from '@lingle/shared/types'
import { createLogger } from '../logger'

const log = createLogger('core:analyzer')

export function buildAnalysisPrompt(
  transcript: ConversationMessage[],
  plan: ExpandedSessionPlan,
  knownSurfaceForms?: string[]
): string {
  const knownVocabSection = knownSurfaceForms && knownSurfaceForms.length > 0
    ? `\nLearner's known vocabulary (already in word bank):\n${knownSurfaceForms.join(', ')}\n`
    : ''

  const numberedTranscript = transcript.map((m, i) => `[${i}] [${m.role}] ${m.content}`).join('\n')

  return `Analyze this conversation transcript and return JSON.

Session plan:
${JSON.stringify(plan, null, 2)}
${knownVocabSection}
Transcript (each message is numbered with its index):
${numberedTranscript}

Analyze the LEARNER's messages (role: "user") for:
1. Which target items were successfully produced by the learner
2. Errors made by the learner (wrong word, wrong grammar, wrong reading)
3. Avoidance events where the learner avoided target items despite opportunity
4. New vocabulary items: any Japanese word used by the assistant or learner that is NOT in the known vocabulary list above. Include words from [VOCAB_CARD] blocks and any other significant vocabulary. Exclude basic particles and conjunctions.
5. Register accuracy: did the learner maintain the target register (${plan.pragmaticTargets.targetRegister})?
6. Communication strategies: circumlocution (talking around unknown words), L1 fallbacks (switching to native language), silence/avoidance
7. Per-item context logs: for each item the learner interacted with, what modality and context

IMPORTANT: For targets_hit, errors_logged, and avoidance_events, always include the "message_index" field referencing the message number from the transcript above where the event occurred.

Respond with ONLY valid JSON matching this schema:
{
  "targets_hit": [{ "item_id": number, "message_index": number, "context_quote": string }],
  "errors_logged": [{ "item_id": number, "error_type": string, "context_quote": string, "message_index": number }],
  "avoidance_events": [{ "item_id": number, "context_quote": string, "message_index": number }],
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
  log.debug('Parsing post-session analysis', { rawLength: raw.length })
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
  }
  const parsed = JSON.parse(cleaned)
  log.debug('Analysis parsed successfully', {
    targetsHit: parsed.targets_hit?.length ?? 0,
    errors: parsed.errors_logged?.length ?? 0,
    avoidance: parsed.avoidance_events?.length ?? 0,
    newItems: parsed.new_items_encountered?.length ?? 0,
    contextLogs: parsed.context_logs?.length ?? 0,
  })
  // Handle targets_hit as either [number] (old) or [{ item_id, message_index, context_quote }] (new)
  const targetsHit = (parsed.targets_hit ?? []).map(
    (t: number | { item_id: number; message_index?: number; context_quote?: string }) => {
      if (typeof t === 'number') return t
      return {
        itemId: t.item_id,
        messageIndex: t.message_index,
        contextQuote: t.context_quote,
      }
    }
  )

  return {
    targetsHit,
    errorsLogged: (parsed.errors_logged ?? []).map(
      (e: { item_id: number; error_type: string; context_quote: string; message_index?: number }) => ({
        itemId: e.item_id,
        errorType: e.error_type,
        contextQuote: e.context_quote,
        messageIndex: e.message_index,
      })
    ),
    avoidanceEvents: (parsed.avoidance_events ?? []).map(
      (a: { item_id: number; context_quote: string; message_index?: number }) => ({
        itemId: a.item_id,
        contextQuote: a.context_quote,
        messageIndex: a.message_index,
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
