import type { SessionPlan, TomBrief, WordBankEntry } from '@shared/types'

export interface LearnerSummary {
  targetLanguage: string
  nativeLanguage: string
  computedLevel: string
  activeItems: WordBankEntry[]
  stableItemCount: number
  burnedItemCount: number
}

export function buildPlanningPrompt(
  learner: LearnerSummary,
  brief: TomBrief
): string {
  return `You are a session planner for a language learning agent.
Given the learner profile below, generate a session plan as JSON.

The plan must include:
- target_vocabulary: 3–5 item IDs from apprentice/journeyman tier not yet produced in conversation
- target_grammar: 1–2 pattern IDs flagged as avoidance or confusion patterns
- difficulty_level: the learner's current level + 1 tier
- register: "casual" or "polite" based on learner's target
- session_focus: one sentence describing the session's theme

Learner profile:
- Language: ${learner.targetLanguage} (native: ${learner.nativeLanguage})
- Level: ${learner.computedLevel}
- Active items: ${learner.activeItems.length}
- Stable items: ${learner.stableItemCount}
- Burned items: ${learner.burnedItemCount}

ToM daily brief:
${JSON.stringify(brief, null, 2)}

Respond with only valid JSON matching this schema:
{
  "target_vocabulary": number[],
  "target_grammar": number[],
  "difficulty_level": string,
  "register": "casual" | "polite",
  "session_focus": string
}`
}

export function buildConversationSystemPrompt(
  learner: LearnerSummary,
  plan: SessionPlan,
  brief: TomBrief
): string {
  return `You are a language conversation partner for a ${learner.targetLanguage} learner.

LEARNER PROFILE SUMMARY:
- Level: ${learner.computedLevel}
- Native language: ${learner.nativeLanguage}
- Current session targets: vocabulary IDs ${JSON.stringify(plan.targetVocabulary)}, grammar IDs ${JSON.stringify(plan.targetGrammar)}
- Output complexity: ${plan.difficultyLevel}
- Register: ${plan.register}
- Known avoidance patterns: ${JSON.stringify(brief.avoidancePatterns)}
- Known confusion pairs: ${JSON.stringify(brief.confusionPairs)}

BEHAVIORAL RULES:
1. Speak primarily in ${learner.targetLanguage} at the specified difficulty level.
2. Engineer natural conversational moments to elicit the target vocabulary and grammar from the learner. Do not force them — create contexts where they arise naturally.
3. When the learner makes a production error, correct via recasting: use the correct form naturally in your next utterance without explicitly pointing out the error. Do not break conversational flow to correct unless the error causes miscommunication.
4. If the learner uses their native language instead of ${learner.targetLanguage}, note it and gently redirect without shaming.
5. Track internally when a target item has been successfully produced by the learner. Acknowledge success subtly.
6. Do not exceed the difficulty level — monitor your own lexical and grammatical complexity.`
}
