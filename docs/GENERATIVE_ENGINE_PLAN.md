# Lingle — Generative Engine Technical Plan

## What This Document Covers

How to evolve Lingle from a text conversation partner into a multimodal, dynamic, reactive language immersion engine — where the AI generates rich interactive lessons, realistic conversation scenarios, and content-based learning experiences that feel like having a human tutor.

---

## Lessons from the Best AI Products

### What the best agents have in common

Every breakthrough AI product (Claude Code, Cursor, Lovable, Suno, Perplexity) shares a set of patterns that make them feel magical. These aren't features — they're architectural decisions.

**1. The model is the CEO, not a script follower.**
Claude Code's entire orchestration is ~50 lines. The runtime is dumb; the model decides every next step. Cursor's agent decides which files to read, which tools to call, and when to stop. Lovable explicitly rejected complex agentic pipelines in favor of letting the model do one big generation.

**Lingle application:** The conversation partner should never follow a rigid script. Give it the learner profile, session plan, ToM brief, and a rich set of tools — then let it drive. The session plan is a set of targets and constraints, not a flowchart.

**2. Context management IS the product.**
Claude Code's auto-compaction, sub-agents, and 6-layer memory. Cursor's semantic indexing with Merkle tree sync. Perplexity's 5-stage retrieval pipeline. Lovable's "hydration" pattern (small model selects relevant context before the big model acts).

**Lingle application:** The learner profile is our equivalent of Cursor's codebase index — a pre-computed semantic understanding that makes every session smarter. Use tiered serialization (active items full detail, stable items summary, burned count only). Use prompt caching aggressively — 87% cost reduction on a typical session.

**3. Constrain the output space to improve quality.**
Lovable constrains to React + TypeScript + Supabase and gets dramatically better code. Perplexity constrains to "never say anything you didn't retrieve" and eliminates hallucination. Suno constrains to musical structures.

**Lingle application:** The difficulty ceiling is our constraint. The AI's vocabulary, grammar, and kanji usage are bounded by the learner's level + 1 tier. Post-session analysis must be structured JSON, not free-form. Exercise generation uses typed Zod schemas. These constraints make the AI more reliable, not less creative.

**4. Separate planning from execution.**
Cursor separates the planning model (expensive) from the apply model (cheap). Windsurf has a dedicated planning agent running in the background. Claude Code uses sub-agents for exploration vs. the main agent for action.

**Lingle application:** Pre-session planning is already a separate call. Add a "micro-planner" that runs between turns: after each learner utterance, a fast model checks which targets have been hit, which remain, and whether to steer. Post-session analysis as a separate, cheaper call.

**5. Speed creates magic.**
Lovable treats speed as the most important UX factor. Cursor's completions are under 1 second. Suno delivers initial audio in ~20 seconds. Perplexity answers in seconds.

**Lingle application:** Session startup must be instant (no planning LLM call). Streaming responses token-by-token. SRS reviews precomputed at app open. Image generation uses placeholders while generating. Voice pipeline targets <1s to first audio.

**6. Variable rewards drive retention.**
Suno's "each generation is different" creates a slot-machine engagement loop. The surprise factor — input effort vs. output quality — is what makes people come back.

**Lingle application:** Each session should feel genuinely different. The AI should have personality, humor, unexpected details. The Insights page ("here's what we learned about you this week") is a powerful retention lever. The gap between typing a prompt and being immersed in a scene is the variable reward.

---

## The Competitive Landscape Gap

Research into Speak, Duolingo, ELSA, Praktika, and others reveals a universal weakness:

**No product maintains a persistent, probabilistic model of what the learner knows.**

- Speak ($1B valuation) has no SRS, no error tracking over time, no vocabulary reintegration. "No cumulative tracking of recurring mistakes."
- Duolingo's AI features feel bolted on to the gamified curriculum, not integrated.
- Praktika's "errors do not influence future lessons."
- ChatGPT forgets your level after a few messages.

Every competitor either has no memory or uses crude level-based approximations. Lingle's learner profile architecture — per-item FSRS states, separate recognition/production tracking, ToM inferences, avoidance detection — is the most technically ambitious approach in the space. **The knowledge model IS the moat.**

### What research says about effective language learning

| Principle | What the research shows | How Lingle implements it |
|---|---|---|
| Comprehensible input (i+1) | Learners need 95-98% comprehensibility | Difficulty levels calibrate AI speech to learner's level + 1 tier |
| Output hypothesis | Production forces noticing, hypothesis testing, metalinguistic reflection | Mastery requires production evidence; items can't advance past Apprentice 4 without it |
| Corrective feedback | Implicit recasts are better maintained over time than explicit correction | Recast-first approach; escalate to explicit for persistent errors via ToM |
| Task-based learning | Tasks involving negotiation of meaning are particularly effective | Session planning generates task-based scenarios targeting specific items |
| Desirable difficulty | Hybrid practice (blocked then interleaved) outperforms either alone | FSRS tracks recognition/production separately; review transitions from blocked to interleaved |

---

## Architecture: The Generative Engine

### Core Principle: Tools as Capabilities

The AI's power comes from its tools. Each new modality — exercises, images, audio, documents — is just another tool the model can call. The model decides when to use each tool based on context. This is the same pattern that makes Claude Code, Cursor, and Lovable work: a small set of powerful primitives that compose into infinite behaviors.

```
┌──────────────────────────────────────────────────────────────┐
│                     CONVERSATION PARTNER                      │
│                                                              │
│  System prompt + learner profile + session plan + ToM brief  │
│                                                              │
│  Tools:                                                      │
│    Text output (streaming markdown)                          │
│    suggestActions     → suggestion chips                     │
│    displayChoices     → branching dialogue buttons            │
│    showVocabularyCard → vocabulary teaching card              │
│    showGrammarNote    → grammar explanation card              │
│    showCorrection     → error correction card                │
│    generateExercise   → interactive exercise (fill-blank,    │
│                         MCQ, matching, ordering, listening)  │
│    generateSceneImage → illustrated scene (async)            │
│    playAudio          → TTS trigger for specific text        │
│    loadContent        → fetch/parse external URL or document │
│                                                              │
│  The model decides what to use based on what the learner     │
│  needs. No hard-coded sequences. No mode switching.          │
└──────────────────────────────────────────────────────────────┘
```

### Streaming Architecture

The Vercel AI SDK provides three tiers of streaming. We use all three for different purposes:

**Tier 1: `streamText` + tool parts (current)**
For the main conversation. Text streams token-by-token. Tool calls (suggestActions, showVocabularyCard) render as typed React components via the PartRenderer. This is what we have today.

**Tier 2: Custom data parts (new)**
For content that updates asynchronously — image generation, document parsing, background analysis. We write typed data parts into the stream with IDs, then update them when ready:

```tsx
// Server writes a loading state
writer.write({ type: 'data-image', id: 'scene-1', data: { status: 'generating' } });
// Text continues streaming...
// When image is ready:
writer.write({ type: 'data-image', id: 'scene-1', data: { status: 'ready', url: imageUrl } });
```

The client shows a placeholder, continues rendering text, then swaps in the image — no interruption.

**Tier 3: `streamObject` (new)**
For generating structured content like exercise sets or lesson plans. The AI generates a Zod-validated JSON object that streams field-by-field, enabling progressive rendering of exercises as they're generated.

### Context Window Management

A tutoring session competes for context space:

| Content | Size | Strategy |
|---|---|---|
| System prompt + behavioral rules | ~1.5K tokens | Prompt cached (breakpoint 1) |
| Learner profile (tiered) | ~2-8K tokens | Prompt cached (breakpoint 2) |
| Loaded document chunks | ~2-5K tokens | RAG-selected, prompt cached (breakpoint 3) |
| Conversation history | Grows unbounded | Auto-cached; summarize after ~20 turns |
| Latest user message | ~100 tokens | Uncached |

**Prompt caching** is the single most impactful optimization. Anthropic's prompt caching provides 90% cost reduction and 85% latency reduction on cached prefixes. For a 10K-token system prompt across 30 turns, this reduces cost from $0.90 to $0.12.

**Conversation summarization** triggers when history exceeds ~20-30 turns. A cheap model (Haiku) summarizes older turns, preserving key topics, errors, and commitments. This reduces context by 70-90% while keeping the last 15-20 turns at full fidelity.

**RAG for documents** — when a user loads an article or PDF, chunk it into ~500-token sections, embed them, and retrieve only the top 3-5 relevant chunks per query. Supabase pgvector handles this natively.

### Model Routing

Use the right model for each job:

| Task | Model | Why |
|---|---|---|
| Main conversation | Claude Sonnet 4 | Quality matters most; streaming, tool use, personality |
| Pre-session planning | Claude Sonnet 4 | Needs to reason about profile, targets, difficulty |
| Between-turn micro-planning | Claude Haiku 4.5 | Fast check: targets hit? steer conversation? |
| Post-session analysis | Claude Haiku 4.5 | Structured JSON extraction from transcript |
| Conversation summarization | Claude Haiku 4.5 | Compression task, doesn't need creativity |
| ToM inference | Claude Haiku 4.5 | Pattern detection across structured data |
| Document parsing/OCR | Claude Sonnet 4 Vision | Needs multimodal capability for images |

---

## Feature: Dynamic Interactive Exercises

### How it works

The AI generates interactive exercises on-the-fly during conversation. When the learner struggles with a concept, the AI calls `generateExercise` with a typed Zod schema. The exercise renders as an interactive React component inline in the chat.

### Exercise types

```typescript
type Exercise =
  | FillBlankExercise    // "私は毎日___を食べます。" → type answer
  | MCQExercise          // Multiple choice with 3-5 options
  | MatchingExercise     // Match Japanese ↔ English pairs (drag or tap)
  | OrderingExercise     // Arrange sentence fragments in correct order
  | ListeningExercise    // Hear audio, answer comprehension question
  | ReadingExercise      // Read passage, answer questions
```

Each type has a Zod schema shared between the AI generation layer and the React rendering layer. The discriminated union pattern ensures type safety end-to-end:

```tsx
// The AI generates this via a tool call:
{
  type: 'fill-blank',
  sentence: '私は毎日{blank}を食べます。',
  blank: 'りんご',
  hint: 'a fruit',
  distractors: ['みかん', 'バナナ', 'ぶどう']
}

// PartRenderer maps tool output to the right component:
case 'tool-generateExercise':
  return <ExerciseRenderer exercise={part.output} onAnswer={handleAnswer} />;
```

### Grading flow

Each exercise component reports results through a shared interface:

```typescript
interface ExerciseResult {
  exerciseType: string;
  itemIds: number[];       // which knowledge model items were tested
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  timeSpentMs: number;
}
```

Results flow into the same pipeline as SRS reviews: update FSRS state, log review events, check mastery state transitions. A correct fill-in-the-blank in conversation counts as production evidence (weighted at 0.5x vs. free conversation production).

### When the AI uses exercises

The AI decides. But the system prompt guides it:

- After teaching a new grammar point, offer a quick fill-in-the-blank
- When the learner confuses two words, present a matching exercise
- During a reading comprehension scenario, generate passage questions
- When the learner seems stuck, offer an easier MCQ to rebuild confidence

The AI should never interrupt flow to force a drill. Exercises emerge naturally from the conversation, like a tutor who says "let me check if you got that" at the right moment.

---

## Feature: Content-Based Learning (Load Anything)

### How it works

The learner shares a URL, uploads a file, or pastes text. The system extracts and processes it, then the AI builds a learning experience around it.

### Content ingestion pipeline

```
User provides content
        │
        ▼
Content Type Router (server action)
        │
        ├── URL → fetch + Mozilla Readability → clean text
        ├── PDF → pdf2json → text (fallback: Claude Vision for scanned docs)
        ├── Image → Claude Vision → extracted Japanese text
        ├── YouTube → youtube-transcript library → captions
        └── Pasted text → direct
        │
        ▼
Text chunker (split into ~500-token sections)
        │
        ▼
Store chunks in DB with embeddings (Supabase pgvector)
        │
        ▼
On each conversation turn:
  Retrieve top 3-5 relevant chunks via vector similarity
  Inject into prompt context (cached after first injection)
```

### What the AI does with loaded content

The conversation partner becomes a reading/listening companion:

- **Article mode**: Walk through the article paragraph by paragraph. Gloss difficult vocabulary with `showVocabularyCard`. Explain grammar with `showGrammarNote`. Generate comprehension exercises with `generateExercise`. Discuss the content in the target language.

- **Media mode** (YouTube, podcast): Work through the transcript. Focus on colloquial speech, slang, and real-world usage that textbooks don't cover. Generate listening exercises.

- **Image mode** (manga, signs, menus): The AI describes what it sees, teaches the vocabulary in context, and creates exercises around the visual content.

The key insight: the AI doesn't need a special "content mode." The meta-prompt already supports reading/listening assistance. Loading content just provides richer context for the same adaptive engine.

### Libraries needed

| Content type | Library | Notes |
|---|---|---|
| URL → text | `@mozilla/readability` + `jsdom` | Powers Firefox Reader View |
| PDF → text | `pdf2json` | Add to `serverComponentsExternalPackages` |
| Image → text | Claude Vision API | Send as `type: "image"` content block |
| YouTube → text | `youtube-transcript` | Hits YouTube's internal Innertube API |
| Embeddings | `voyage-3-large` or `text-embedding-3-large` | For RAG chunk retrieval |
| Vector search | Supabase pgvector | Already using Supabase |

---

## Feature: Voice Conversations

### Pipeline: STT → LLM → TTS

The modular pipeline (not speech-to-speech) is correct because we need the intermediate transcript for error logging, learner profile updates, and post-session analysis.

```
User speaks → mic
        │
        ▼
STT: gpt-4o-mini-transcribe (best Japanese accuracy, <400ms)
        │
        ▼
Transcript text → same LLM pipeline as text chat
        │                    │
        │                    ▼
        │              Claude Sonnet 4 (streaming)
        │                    │
        │                    ▼ (sentence boundary detection)
        │              TTS: ElevenLabs Flash v2.5 (<100ms TTFB)
        │                    │
        ▼                    ▼
Transcript logged       Audio chunks → speaker
to DB + profile         (streaming, sentence-by-sentence)
```

### Sentence-level streaming

The key optimization: don't wait for the full LLM response before starting TTS. Buffer LLM output until a sentence-ending punctuation mark (。for Japanese, . for English), then immediately send that sentence to TTS while the next sentence continues generating. The user hears the first sentence in <1 second.

### Latency budget

| Stage | Target | Best available |
|---|---|---|
| STT | <400ms | Deepgram Nova-3: ~150ms |
| LLM first token | <500ms | Claude Sonnet streaming: ~300-500ms |
| TTS first audio | <100ms | ElevenLabs Flash: ~75ms |
| **Total voice-to-voice** | **<1s** | **~525-725ms achievable** |

### Voice-specific learner signals

When voice is added, the knowledge model gains new signal:

- **Pronunciation accuracy**: Compare STT transcript against expected utterance
- **Hesitation events**: Long pauses mid-utterance as fluency indicators
- **L1 intrusion**: English detected mid-Japanese utterance (STT catches this)
- **Speaking pace**: Words-per-minute tracked per session, trended over time

### Development path

1. Start with VOICEVOX (free, offline Japanese TTS) for development
2. Upgrade to ElevenLabs Flash for production quality
3. Use `gpt-4o-mini-transcribe` for STT from the start (best Japanese accuracy)
4. Transport: WebSockets for MVP, upgrade to WebRTC (via LiveKit) for production latency

---

## Feature: Scene Illustration

### How it works

When the AI describes a new scene (entering the ramen shop, arriving at the train station), it calls `generateSceneImage` to create an illustration. The image renders inline in the chat while text continues streaming.

### Implementation

```tsx
generateSceneImage: tool({
  description: 'Generate an illustration for the current scene',
  inputSchema: z.object({
    sceneDescription: z.string(),
    style: z.enum(['anime', 'watercolor', 'illustration', 'photo-realistic']),
  }),
  execute: async ({ sceneDescription, style }) => {
    const result = await generateImage({
      model: replicate.image('black-forest-labs/flux-schnell'),
      prompt: `${sceneDescription}, ${style} style, Japanese cultural context`,
    });
    return { url: result.image.url, description: sceneDescription };
  },
})
```

On the client, the PartRenderer shows a styled placeholder while generating, then swaps in the image. FLUX.1 Schnell generates in ~1.8 seconds at ~$0.003/image — negligible cost.

### When to generate

The AI decides, but guidelines:
- Generate when entering a new setting (not every turn)
- Generate for culturally specific scenes the learner might not be able to visualize
- Don't generate for abstract conversations or grammar discussions
- 2-5 images per immersive session is the sweet spot

---

## Tool Design: The Full Capability Set

### Current tools (shipping today)

| Tool | Purpose | Renders as |
|---|---|---|
| `suggestActions` | 2-3 contextual next actions | Suggestion chips below messages |
| `displayChoices` | Branching dialogue options | Numbered buttons with hints |
| `showVocabularyCard` | Teach a vocabulary word | Card with word, reading, meaning, example |
| `showGrammarNote` | Explain a grammar point | Card with pattern, formation, examples |
| `showCorrection` | Correct a learner error | Card with original, corrected, explanation |

### Near-term tools (next iteration)

| Tool | Purpose | Renders as |
|---|---|---|
| `generateExercise` | Interactive exercises (fill-blank, MCQ, matching, ordering) | Interactive component with grading |
| `generateListeningExercise` | Audio comprehension exercise | TTS playback + question + options |
| `generateSceneImage` | Illustrate the current scene | Inline image with placeholder |

### Future tools

| Tool | Purpose | Renders as |
|---|---|---|
| `loadContent` | Fetch and parse external URL/document | Content panel with extracted text |
| `kanjiPractice` | Stroke order practice for a kanji | Interactive canvas component |
| `conjugationDrill` | Verb conjugation practice | Quick-fire drill component |
| `culturalNote` | Expanded cultural context | Expandable aside with details |
| `pronunciationCheck` | Compare learner's audio to target | Waveform visualization |

### Tool design principles (from Anthropic's engineering)

1. **Poka-yoke design**: Structure arguments to make mistakes impossible. Use enums over free strings. Use typed schemas.
2. **Clear descriptions**: The description is more important than the parameter names. Tell the model exactly when and why to use the tool.
3. **Self-contained**: Each tool should do one thing completely. Don't require the model to chain tools for basic operations.
4. **Progressive rendering**: Every tool should have a loading state. Use the `yield → return` pattern or data part updates.
5. **Keep the set small**: Start with 5-8 tools. The model becomes less reliable as tool count increases. Use tool search for rarely-used tools.

---

## The Micro-Planner: Between-Turn Intelligence

### The problem

The session plan has 3-5 vocabulary targets and 1-2 grammar targets. But the conversation partner (Claude Sonnet) doesn't explicitly track progress against the plan during the conversation. It might naturally hit some targets and miss others.

### The solution

After each learner utterance, before the main model generates its response, run a fast micro-planning step:

```
Learner says something
        │
        ▼
Haiku micro-planner (fast, cheap, ~200ms):
  Input: session plan + last 5 turns + learner's latest message
  Output: {
    targetsHit: ["食べる produced correctly"],
    targetsRemaining: ["駅", "〜てから"],
    steeringHint: "Try to bring up train stations naturally",
    errorDetected: null
  }
        │
        ▼
Steering hint injected as a system message before Sonnet generates
        │
        ▼
Sonnet generates response (with subtle steering toward remaining targets)
```

This is the same pattern as Cursor's "planning agent runs in background while action agent handles immediate tasks." The micro-planner costs <$0.001 per turn and adds ~200ms latency — invisible in a conversation with streaming.

### Why this matters

Without the micro-planner, the AI has to hold the session plan in its working memory and simultaneously maintain conversational flow. With it, the heavy model focuses entirely on being a great conversation partner while the cheap model handles target tracking. Separation of concerns.

---

## Progressive Disclosure: Showing Work

### What the best products do

Claude Code streams with a "collapsed but available" three-layer display. Perplexity shows sources before the answer. Cursor shows which files the agent is examining.

### What Lingle should show

**During a session:**
- Session target sidebar (collapsible): vocabulary and grammar targets with checkmarks as they're produced
- Currently-loaded content preview (if user loaded an article)
- Session timer

**After a session:**
- Step-by-step analysis: "Analyzing transcript... Found 3 target hits... Detected 1 avoidance pattern... Updating knowledge model"
- Production evidence highlights: show the exact moments in the transcript where target items were produced
- FSRS state changes: "Stability: 4d → 8d" after correct reviews
- New items discovered: words the learner encountered for the first time

**On the Insights page:**
- "30 days ago, we knew 47 words. Now we've confirmed 312."
- "Your accuracy on て-form went from 40% to 85% over 3 weeks."
- Weekly reports that feel like opening a journal that knows you better than you know yourself

---

## Implementation Phases

### Phase A: Exercise Generation (next)

**Add to existing conversation flow. No new infrastructure needed.**

1. Define exercise Zod schemas (fill-blank, MCQ, matching, ordering)
2. Create `<ExerciseRenderer>` component with sub-components for each type
3. Add `generateExercise` tool to `conversation-tools.ts`
4. Update `PartRenderer` to handle `tool-generateExercise` parts
5. Connect exercise results to the knowledge model (FSRS updates)

**Effort**: ~1 week. **Impact**: Transforms passive conversation into active learning.

### Phase B: Content Ingestion

**Let users load external content into conversations.**

1. Add URL input field to the idle phase UI
2. Create `/api/content/extract` route with Readability + content type detection
3. Store extracted text chunks with embeddings in Supabase pgvector
4. Add RAG retrieval to the conversation send route
5. Update system prompt to include retrieved content context

**Effort**: ~1-2 weeks. **Impact**: Infinite content library — any article, video, or image becomes a lesson.

### Phase C: Scene Illustration

**Add visual immersion to conversation scenarios.**

1. Add Replicate provider to AI SDK (`@ai-sdk/replicate`)
2. Create `generateSceneImage` tool with FLUX.1 Schnell
3. Add `<SceneImage>` component with placeholder/loading state
4. Update PartRenderer for `tool-generateSceneImage` parts
5. Store generated images for session replay

**Effort**: ~3-5 days. **Impact**: Scenes become visual, not just textual.

### Phase D: Voice Pipeline

**Full speech conversations.**

1. Add mic input component with Web Audio API
2. Create `/api/voice/stt` route with `gpt-4o-mini-transcribe`
3. Create `/api/voice/tts` route with ElevenLabs Flash (upgrade from OpenAI)
4. Implement sentence-boundary streaming (buffer LLM output → TTS per sentence)
5. Add voice-specific learner signals (hesitation, L1 intrusion, pace)

**Effort**: ~2-3 weeks. **Impact**: The app becomes a speaking partner, not just a texting partner.

### Phase E: Micro-Planner + Knowledge Model

**Make every session smarter than the last.**

1. Implement between-turn micro-planner with Haiku
2. Build pre-session planning that reads the knowledge model
3. Build post-session analysis that writes back to the knowledge model
4. Implement ToM inference engine (avoidance, confusion pairs, regression)
5. Build the Insights page showing learner progress over time

**Effort**: ~3-4 weeks. **Impact**: The moat. No competitor has this.

### Phase F: Prompt Caching + Cost Optimization

**Make the engine sustainable at scale.**

1. Implement Anthropic prompt caching with 3 breakpoints
2. Add tiered profile serialization
3. Add conversation summarization for long sessions
4. Route secondary tasks to Haiku (micro-planning, analysis, summarization)
5. Add extended cache TTL (1 hour) for active sessions

**Effort**: ~1 week. **Impact**: 87% cost reduction per session.

---

## Technical Decisions

### SSE vs WebSockets vs WebRTC

- **SSE** for all text/exercise/image streaming (current and future). Unidirectional, auto-reconnect, works with HTTP/2. This is what the AI SDK uses.
- **WebSockets** for voice MVP only. Bidirectional audio streaming.
- **WebRTC** for production voice (via LiveKit). Reduces latency by ~300ms vs WebSockets. Native echo cancellation and noise suppression.

### Generative UI Approach

Use the **controlled generative UI pattern**: the AI selects from predefined React components and fills them with data via typed tool calls. Not open-ended code generation. This keeps the design system consistent, is type-safe, and is what the Vercel AI SDK supports best.

The PartRenderer is already the right architecture. Each new tool type maps to a new component:

```tsx
case 'tool-generateExercise':
  return <ExerciseRenderer exercise={part.output} />;
case 'tool-generateSceneImage':
  return <SceneImage {...part.output} />;
case 'tool-showVocabularyCard':
  return <VocabularyCard {...part.output} />;
```

### State Management for Interactive Components

Exercise components, choice buttons, and other interactive elements need local state (selected answer, submitted status, score). Keep this in React component state, not in the message stream. The message stream contains the exercise definition; the component manages interaction state. Report results back to the server via a separate API call, not through the chat.

### Database Additions

| Table | Purpose |
|---|---|
| `ContentSource` | Stored URLs, files, and extracted text chunks |
| `ContentChunk` | Individual chunks with embeddings for RAG |
| `ExerciseResult` | Results from inline exercises (links to ReviewEvent) |
| `VoiceSession` | Voice-specific metadata (speaking pace, hesitation count) |
| `GeneratedImage` | Stored scene illustrations for session replay |

---

## What This All Adds Up To

A learner opens Lingle. They paste a link to an NHK article they found interesting. The AI reads the article, generates a brief summary at their level, then walks them through it paragraph by paragraph — glossing vocabulary, explaining grammar, generating quick exercises to check comprehension. When they finish, the AI asks if they want to roleplay the scenario described in the article. They say yes. The scene comes alive with characters and an illustrated setting. They practice ordering at the restaurant described in the article, using the vocabulary they just learned. After 15 minutes, they end the session. The app analyzes their transcript, updates their knowledge model, and surfaces the new vocabulary in their SRS queue tomorrow.

They didn't study. They read something interesting, then lived in it.

That's the generative engine.
