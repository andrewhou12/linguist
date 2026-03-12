import { NextResponse } from 'next/server'
import { streamObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { withAuth } from '@/lib/api-helpers'

export const maxDuration = 60
import { withUsageCheck } from '@/lib/usage-guard'
import { prisma } from '@lingle/db'

const voiceAnalysisSchema = z.object({
  corrections: z.array(z.object({
    original: z.string().describe('The incorrect phrase only'),
    corrected: z.string().describe('The corrected phrase'),
    explanation: z.string().describe('One short sentence'),
    grammarPoint: z.string().optional().describe('2-3 word label'),
  })).describe('Genuine grammar/vocab errors only. 0-2 items max.'),
  naturalnessFeedback: z.array(z.object({
    original: z.string().describe('What the learner said'),
    suggestion: z.string().describe('More natural way to say it'),
    explanation: z.string().describe('One sentence'),
  })).describe('0-1 items max. Only clear cases.'),
  alternativeExpressions: z.array(z.object({
    original: z.string().describe('What the learner said'),
    alternative: z.string().describe('More idiomatic alternative'),
    explanation: z.string().describe('One sentence'),
  })).describe('0-1 items max. Only when notably better.'),
  registerMismatches: z.array(z.object({
    original: z.string().describe('What the learner said'),
    suggestion: z.string().describe('Same idea in the correct register'),
    expected: z.string().describe('"casual", "polite", or "formal"'),
    explanation: z.string().describe('One sentence'),
  })).describe('0-1 items max. Only when formality is clearly wrong for the context.'),
  l1Interference: z.array(z.object({
    original: z.string().describe('What the learner said'),
    issue: z.string().describe('One sentence describing the native-language pattern'),
    suggestion: z.string().describe('Natural target-language way to express it'),
  })).describe('0-1 items max. Only when sentence structure clearly mirrors the native language.'),
  conversationalTips: z.array(z.object({
    tip: z.string().describe('Short actionable tip'),
    explanation: z.string().describe('One sentence — why it matters culturally/pragmatically'),
  })).describe('0-1 items max. Only when the learner misses a clear social/cultural cue.'),
  takeaways: z.array(z.string()).describe('0-1 high-level session notes. Only genuinely memorable insights. Most turns should have 0.'),
  sectionTracking: z.object({
    currentSectionId: z.string(),
    completedSectionIds: z.array(z.string()),
  }).optional().describe('Track conversation section progress. Only if sections exist.'),
})

export const POST = withAuth(withUsageCheck(async (request, { userId: _userId }) => {
  const { sessionId, userMessage, assistantMessage, recentHistory } = await request.json()

  if (!sessionId || !userMessage || !assistantMessage) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const session = await prisma.conversationSession.findUnique({
    where: { id: sessionId },
    select: { targetLanguage: true, userId: true, sessionPlan: true },
  })
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: session.userId },
    select: { difficultyLevel: true, nativeLanguage: true, targetLanguage: true },
  })

  const historyBlock = recentHistory?.length
    ? `Recent conversation context:\n${recentHistory.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\n\n`
    : ''

  // Extract sections and register from session plan
  const sessionPlan = session.sessionPlan as Record<string, unknown> | null
  const sections = sessionPlan?.sections as Array<{ id: string; label: string; description: string }> | undefined
  const sectionsBlock = sections?.length
    ? `\nConversation sections to track:\n${sections.map(s => `- ${s.id}: ${s.label} — ${s.description}`).join('\n')}\n`
    : ''
  const register = (sessionPlan?.register as string) || ''
  const registerBlock = register ? `- Expected register: ${register}\n` : ''

  const SPOKEN_LANGUAGE_RULES: Record<string, string> = {
    Japanese: 'IGNORE particle omission natural in casual spoken Japanese (e.g. dropping は, を, が). IGNORE casual contractions (e.g. ている→てる, ではない→じゃない). IGNORE sentence-final particles and filler words (えっと, あの, まあ).',
    Korean: 'IGNORE marker omission natural in casual spoken Korean (e.g. dropping 은/는, 이/가, 을/를). IGNORE casual contractions (e.g. 하는 것→하는 거, 것이→게). IGNORE filler words (음, 그, 어).',
    'Mandarin Chinese': 'IGNORE filler words natural in spoken Mandarin (那个, 嗯, 就是). IGNORE omission of 的 in casual speech. IGNORE topic-prominent structures where the subject is dropped (pro-drop). IGNORE measure word simplification in casual speech (e.g. using 个 as a general classifier).',
    Spanish: 'IGNORE subject pronoun omission natural in spoken Spanish (pro-drop language). IGNORE filler words (bueno, pues, o sea, es que). IGNORE casual contractions (pa\' for para, na\' for nada). IGNORE leísmo/laísmo that is regionally standard. IGNORE dropped -d- in past participles in casual speech (e.g. cansao for cansado).',
    French: 'IGNORE "ne" omission in spoken negation (e.g. "je sais pas" instead of "je ne sais pas") — this is standard spoken French. IGNORE filler words (euh, ben, bon, enfin, quoi, du coup). IGNORE on used instead of nous. IGNORE informal question formation without inversion (e.g. "tu viens?" instead of "viens-tu?").',
    German: 'IGNORE filler words natural in spoken German (also, halt, mal, na ja, ähm). IGNORE casual word order variations in spoken speech. IGNORE weil + verb-second order (common in spoken German though technically non-standard). IGNORE shortened forms (e.g. hab for habe, is for ist). IGNORE denn/mal particles that add conversational nuance.',
    Italian: 'IGNORE subject pronoun omission natural in spoken Italian (pro-drop language). IGNORE filler words (allora, cioè, tipo, praticamente, insomma). IGNORE passato prossimo used instead of passato remoto in spoken northern Italian. IGNORE informal question formation. IGNORE clitic doubling in casual speech.',
    Portuguese: 'IGNORE subject pronoun omission natural in spoken Portuguese (pro-drop language). IGNORE filler words (tipo, né, então, bom, sei lá). IGNORE ter used instead of haver in compound tenses in Brazilian Portuguese. IGNORE a gente used instead of nós. IGNORE pra/pro contractions (para + a/o). IGNORE tu with third-person verb conjugation common in Brazilian spoken Portuguese.',
  }
  const spokenRule = SPOKEN_LANGUAGE_RULES[profile?.targetLanguage ?? session.targetLanguage ?? ''] || ''

  try {
    const result = streamObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: voiceAnalysisSchema,
      prompt: `Analyze ONLY what the LEARNER said in this exchange. The assistant's message is provided for context only — do NOT analyze it or suggest how the learner should respond to it.

${historyBlock}Learner said: ${userMessage}
Assistant replied: ${assistantMessage}

Target: ${profile?.targetLanguage ?? session.targetLanguage} | Native: ${profile?.nativeLanguage ?? 'English'} | Level: ${profile?.difficultyLevel ?? 3}
${registerBlock}${sectionsBlock}
CRITICAL — IGNORE THESE (they are NOT errors):
- Transcription artifacts (punctuation, spacing, formatting from speech-to-text).
- Casual vs. formal variants of the same expression (e.g. ている↔てる, ではない↔じゃない). These are style choices, NOT errors. NEVER flag one as a correction of the other.
${spokenRule ? `- ${spokenRule}\n` : ''}
Rules:
- ONLY analyze the learner's message above. Do NOT give tips about how to respond to the assistant.
- corrections: Flag genuine grammar/vocabulary errors in what the learner said. Keep explanations to one sentence. Do NOT flag casual/formal alternations as errors.
- naturalnessFeedback: Flag textbook-ish phrasing the learner used that a native speaker would say differently. 0-1 max.
- alternativeExpressions: Suggest more idiomatic ways to express what the learner said. 0-1 max.
- registerMismatches: Flag when the learner's formality level is wrong for the conversation context. 0-1 max.
- l1Interference: Flag when the learner's sentence structure or word choice mirrors ${profile?.nativeLanguage ?? 'English'} instead of natural ${profile?.targetLanguage ?? session.targetLanguage}. 0-1 max.
- conversationalTips: Flag cultural/pragmatic issues in what the learner said (was too direct, missed a social cue in their response, etc.). Do NOT suggest what to say next. 0-1 max.
- takeaways: A memorable insight from what the learner encountered — a key expression, cultural note, or "aha moment." 0-1 max.
- Focus on the 1-2 most useful items per turn. If the learner's message was perfect, return empty arrays.`,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const partial of result.partialObjectStream) {
            controller.enqueue(encoder.encode(JSON.stringify(partial) + '\n'))
          }
        } catch (err) {
          console.error('[voice-analyze] Stream error:', err)
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
    })
  } catch (err) {
    console.error('[voice-analyze] Analysis failed:', err)
    return NextResponse.json({ corrections: [], naturalnessFeedback: [], alternativeExpressions: [], registerMismatches: [], l1Interference: [], conversationalTips: [], takeaways: [], sectionTracking: undefined })
  }
}))
