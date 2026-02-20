import type {
  ConversationMessage,
  PragmaticState,
} from '@shared/types'
import { createLogger } from '../logger'

const log = createLogger('core:pragmatics')

// ── Prompt building ──

export interface PragmaticAnalysisInput {
  transcript: ConversationMessage[]
  targetRegister: 'casual' | 'polite'
  targetLanguage: string
  nativeLanguage: string
}

export interface PragmaticAnalysisResult {
  casualCorrect: number
  casualTotal: number
  politeCorrect: number
  politeTotal: number
  registerSlips: number
  circumlocutions: Array<{ contextQuote: string; targetItem?: string }>
  l1Fallbacks: Array<{ contextQuote: string; intendedMeaning?: string }>
  silenceEvents: number
  avoidedPatterns: string[]
}

export function buildPragmaticAnalysisPrompt(input: PragmaticAnalysisInput): string {
  return `Analyze this ${input.targetLanguage} conversation transcript for pragmatic competence indicators.

TARGET REGISTER: ${input.targetRegister}
LEARNER'S NATIVE LANGUAGE: ${input.nativeLanguage}

Analyze the LEARNER's messages (role: "user") for:

1. REGISTER USAGE: Count how many utterances correctly use the target register (${input.targetRegister}) and how many slip into the wrong register. Also count any utterances in the alternate register that were correct for their context.

2. CIRCUMLOCUTION: Identify instances where the learner talks around a word they don't know — describing it instead of using the direct term. This is a positive communication strategy.

3. L1 FALLBACKS: Identify instances where the learner falls back to ${input.nativeLanguage} (their native language) instead of using ${input.targetLanguage}.

4. SILENCE/AVOIDANCE: Note any points where the learner appears to avoid complex structures or topics (very short responses when more was expected, topic changes to avoid difficulty).

5. AVOIDED PATTERNS: List any grammar patterns the learner seems to consistently avoid (e.g., passive voice, conditional, て-form chains).

Transcript:
${input.transcript.map((m) => `[${m.role}] ${m.content}`).join('\n')}

Respond with ONLY valid JSON matching this schema:
{
  "casual_correct": number,
  "casual_total": number,
  "polite_correct": number,
  "polite_total": number,
  "register_slips": number,
  "circumlocutions": [{ "context_quote": string, "target_item": string | null }],
  "l1_fallbacks": [{ "context_quote": string, "intended_meaning": string | null }],
  "silence_events": number,
  "avoided_patterns": string[]
}`
}

// ── Response parsing ──

export function parsePragmaticAnalysis(raw: string): PragmaticAnalysisResult {
  log.debug('Parsing pragmatic analysis', { rawLength: raw.length })
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
  }
  const parsed = JSON.parse(cleaned)
  log.debug('Pragmatic analysis parsed', {
    registerSlips: parsed.register_slips ?? 0,
    circumlocutions: parsed.circumlocutions?.length ?? 0,
    l1Fallbacks: parsed.l1_fallbacks?.length ?? 0,
  })
  return {
    casualCorrect: parsed.casual_correct ?? 0,
    casualTotal: parsed.casual_total ?? 0,
    politeCorrect: parsed.polite_correct ?? 0,
    politeTotal: parsed.polite_total ?? 0,
    registerSlips: parsed.register_slips ?? 0,
    circumlocutions: (parsed.circumlocutions ?? []).map(
      (c: { context_quote: string; target_item?: string }) => ({
        contextQuote: c.context_quote,
        targetItem: c.target_item ?? undefined,
      })
    ),
    l1Fallbacks: (parsed.l1_fallbacks ?? []).map(
      (f: { context_quote: string; intended_meaning?: string }) => ({
        contextQuote: f.context_quote,
        intendedMeaning: f.intended_meaning ?? undefined,
      })
    ),
    silenceEvents: parsed.silence_events ?? 0,
    avoidedPatterns: parsed.avoided_patterns ?? [],
  }
}

// ── State update with exponential moving average ──

const EMA_ALPHA = 0.3 // Weight for new data vs. historical

export function updatePragmaticState(
  current: PragmaticState,
  result: PragmaticAnalysisResult
): PragmaticState {
  log.debug('Updating pragmatic state', {
    currentCasualAccuracy: current.casualAccuracy,
    currentPoliteAccuracy: current.politeAccuracy,
  })
  // Compute session accuracies
  const sessionCasualAccuracy =
    result.casualTotal > 0 ? result.casualCorrect / result.casualTotal : current.casualAccuracy
  const sessionPoliteAccuracy =
    result.politeTotal > 0 ? result.politeCorrect / result.politeTotal : current.politeAccuracy

  // Apply exponential moving average
  const newCasualAccuracy =
    current.casualAccuracy === 0
      ? sessionCasualAccuracy
      : EMA_ALPHA * sessionCasualAccuracy + (1 - EMA_ALPHA) * current.casualAccuracy
  const newPoliteAccuracy =
    current.politeAccuracy === 0
      ? sessionPoliteAccuracy
      : EMA_ALPHA * sessionPoliteAccuracy + (1 - EMA_ALPHA) * current.politeAccuracy

  // Merge avoided patterns (union of existing + newly detected)
  const avoidedSet = new Set([
    ...current.avoidedGrammarPatterns,
    ...result.avoidedPatterns,
  ])

  return {
    casualAccuracy: Math.round(newCasualAccuracy * 100) / 100,
    politeAccuracy: Math.round(newPoliteAccuracy * 100) / 100,
    registerSlipCount: current.registerSlipCount + result.registerSlips,
    preferredRegister: current.preferredRegister,
    circumlocutionCount: current.circumlocutionCount + result.circumlocutions.length,
    silenceEvents: current.silenceEvents + result.silenceEvents,
    l1FallbackCount: current.l1FallbackCount + result.l1Fallbacks.length,
    averageSpeakingPace: current.averageSpeakingPace, // V2: updated by voice pipeline
    hesitationRate: current.hesitationRate, // V2: updated by voice pipeline
    avoidedGrammarPatterns: Array.from(avoidedSet),
    avoidedVocabIds: current.avoidedVocabIds, // Updated separately via ToM
  }
}
