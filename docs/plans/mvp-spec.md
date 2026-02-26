# Linguist MVP — Technical Specification

## February 2026

---

## 1. The Thesis

The MVP validates one claim: **a conversation partner with persistent knowledge state produces measurably better learning outcomes than one without it.**

Everything else is cut or folded into the conversation. No separate review tab. No standalone lesson viewer. No input feed. The chat IS the product. If a learner opens Linguist, they see a conversation — and that conversation is where curriculum delivery, mastery reinforcement, error correction, and progress tracking all happen.

This is a deliberate reduction of surface area. The vision describes five activity surfaces (conversation, reviews, lessons, input feed, kanji track). The MVP ships one: a conversation that does the work of all five. If the knowledge model is real — if it measurably improves session quality over 30 days — then the foundation is proven and every other surface can be built on top of it. If it doesn't, no amount of additional features will save the product.

### What We're Validating

1. The conversation agent's session plans visibly improve as the knowledge model grows (sessions at day 20 are measurably more targeted than day 1)
2. The post-session analysis loop correctly identifies and tracks mastery evidence from natural conversation
3. Items that the system targets in conversation are retained at a higher rate than items encountered passively
4. A learner who uses this daily for 30 days has a demonstrably richer, more accurate knowledge model than on day 1

### What We're NOT Validating Yet

- Whether standalone SRS reviews improve retention beyond conversation reinforcement
- Whether structured lessons produce faster grammar acquisition than conversation exposure
- Whether native input content drives acquisition
- Whether kanji should be built in-house or integrated
- Voice/audio

---

## 2. Product Shape

### One Screen: The Conversation

The learner opens the app and lands in a conversation interface. There is no sidebar navigation to a "Review" tab, no "Lessons" page, no "Word Bank" browser. There is one screen: a chat with a persistent character.

Above the chat, a small **challenge card** shows today's targets:

```
Today's challenges:
[ ] Use ～てから at least once
[ ] Use a polite negative (～ません)
[ ] Stretch: try 締め切り in context
```

Challenges check off in real-time as the learner hits them. This gives the open-ended conversation a game-like structure — clear goals, visible progress, immediate feedback.

### Structured Content Delivered In-Chat

The conversation partner isn't limited to free dialogue. It can inject structured learning moments as **rich message types** within the chat flow:

**Vocabulary introduction cards.** When the session plan calls for introducing a new word, the agent doesn't just use it and hope the learner catches on. It sends a structured card:

```
┌─────────────────────────────────┐
│  📖 New word                    │
│  締め切り (しめきり)              │
│  deadline                       │
│                                 │
│  あしたが締め切りです。            │
│  "Tomorrow is the deadline."    │
└─────────────────────────────────┘
```

Then immediately uses the word in conversation context: "ところで、最近何か締め切りある？" The introduction and the natural usage happen in one continuous flow.

**Grammar spotlight cards.** When a grammar pattern is the session target, the agent can surface a brief explanation before or after natural usage:

```
┌─────────────────────────────────────────┐
│  📝 Grammar: ～てから (after doing ~)    │
│                                         │
│  ご飯を食べてから、勉強した。              │
│  "After eating, I studied."             │
│                                         │
│  V-て form + から = "after V-ing"       │
└─────────────────────────────────────────┘
```

**Inline review prompts.** Instead of a separate review session, the agent can embed quick recall checks mid-conversation:

```
┌───────────────────────────────────┐
│  🔄 Quick check                   │
│  How do you say "deadline"?       │
│                                   │
│  [ Show answer ]                  │
└───────────────────────────────────┘
```

The learner types their answer, the agent evaluates it, and the FSRS state updates — all without leaving the conversation.

**Error correction recasts.** When the learner makes an error, the agent recasts naturally and optionally shows a subtle correction card:

```
You: 学校を行きました
Agent: あ、学校に行ったんだ。何をした？

┌──────────────────────────────────────────┐
│  💡 学校に行く (not を)                    │
│  Movement verbs use に for destination    │
└──────────────────────────────────────────┘
```

**Session summary.** When the conversation ends, a summary card is rendered inline:

```
┌─────────────────────────────────────────┐
│  📊 Session Complete · 12 min           │
│                                         │
│  Challenges: 2/3 hit                    │
│  ✅ Used ～てから (twice!)               │
│  ✅ Used 締め切り naturally              │
│  ❌ Avoided ～ません (collapsed to ない)  │
│                                         │
│  Errors: 1 particle (に/を)             │
│  New words encountered: 都合             │
│                                         │
│  → Tomorrow: target ～ません again       │
└─────────────────────────────────────────┘
```

### What This Replaces

| V1 vision feature | MVP approach |
|---|---|
| SRS review session | Inline review prompts in conversation + FSRS evidence from production |
| Lesson/curriculum page | Vocabulary and grammar cards delivered in-chat by the agent |
| Word bank browser | Post-session summary + knowledge state accessible via a simple "stats" view |
| Dashboard | Challenge card at top of conversation + session summary at end |
| Input feed | Mini-dialogues and example sentences generated inline by the agent |
| Insights (ToM) | ToM runs silently; its output shapes the session plan, not a separate page |

### The One Exception: A Knowledge State View

The conversation is the primary surface, but the learner needs one more thing: a way to see their knowledge model. Not to interact with it (no manual editing, no SRS queue management), but to see it. This is the "progress that is felt" principle from the vision.

A minimal **Knowledge State** view, accessible from a small icon in the conversation header:

- Total items tracked (by mastery tier)
- A simple visual of mastery distribution (bar chart or dot map)
- Current level and progression
- Recent session history (dates, challenge completion, items learned)

This view is read-only. It exists so the learner can see the model growing. No actions, no settings, no manual overrides.

---

## 3. Architecture

### Platform: Web (Next.js)

The MVP ships as a web app, not Electron. Reasons:

1. **Distribution.** No install barrier. Send a link, start learning. Critical for early testing with real users.
2. **Iteration speed.** Deploy changes instantly. No app store review, no update distribution.
3. **Existing state.** The web app (`apps/web`) already has working API routes for conversation planning, message exchange, session ending, curriculum, ToM, and profile management. The desktop app is more polished but the web routes are functionally equivalent.

The Electron app is not abandoned — it continues to exist for eventual desktop-quality UX. But the MVP validation happens on web.

### What Already Exists (and What Needs Work)

**Fully built and usable as-is:**
- `packages/core/` — All business logic: conversation planner, post-session analyzer, FSRS scheduler, ToM engine, curriculum recommender, pragmatics analyzer, profile calculator. Pure TypeScript, no framework dependencies.
- `prisma/schema.prisma` — Complete schema with all needed models: LexicalItem, GrammarItem, ChunkItem, ReviewEvent, ConversationSession, TomInference, ItemContextLog, PragmaticProfile, CurriculumItem.
- `packages/core/src/curriculum/data/` — Reference data files: vocabulary.json, grammar.json, collocations.json, chunks.json, pragmatic-formulas.json, curriculum-spine.json.
- `apps/web/app/api/conversation/plan/route.ts` — Full session planning: builds learner summary, generates ToM brief, calls Claude for session plan, creates DB session.
- `apps/web/app/api/conversation/send/route.ts` — Message exchange with system prompt and transcript management.
- `apps/web/app/api/conversation/end/route.ts` — Session termination (needs post-analysis wiring).
- Auth via Supabase Google OAuth.

**Needs significant rework for MVP:**
- `apps/web/app/(app)/learn/page.tsx` — Currently a three-phase flow (planning preview → conversation → summary). Needs to become the single primary conversation interface with rich message types. The planning phase should be invisible (auto-runs on session start), and the summary should render inline.
- `apps/web/app/(app)/chat/page.tsx` — Generic chat using `@ai-sdk/react` with no learning awareness. This should be replaced by (or merged into) the conversation-first learning interface.
- Post-session analysis — The `conversation/end` API route needs to call the analyzer, update mastery states, log context, run pragmatic analysis, and trigger profile recalculation. The desktop `conversation.ts` IPC handler (700+ lines) does all of this. The web route does not yet.

**Needs to be built:**
- Rich message type rendering (vocab cards, grammar cards, inline reviews, correction cards, session summary cards) in the chat UI.
- Challenge card component (shows today's targets, updates in real-time).
- Knowledge state view (read-only mastery dashboard).
- Onboarding flow for web (placement to seed the knowledge model).
- Streaming conversation responses (current web route waits for full response; should stream for UX).

### Data Flow

```
Learner opens app
    ↓
Auto-plan session (API: /api/conversation/plan)
    → Reads learner profile, active items, ToM inferences
    → Generates curriculum recommendations
    → Calls Claude to produce session plan
    → Stores session + system prompt in DB
    → Returns challenge targets to UI
    ↓
Conversation begins
    ↓
Each message (API: /api/conversation/send)
    → Appends to transcript in DB
    → Sends to Claude with full system prompt + recent transcript
    → Agent may return structured content (vocab card, grammar card, inline review)
    → Response streamed to UI
    → UI checks if any challenge targets were hit → updates challenge card
    ↓
Learner ends session (API: /api/conversation/end)
    → Runs post-session analysis (Claude call against transcript + plan)
    → Extracts: targets hit, errors, avoidance events, new items, register accuracy
    → Updates FSRS states for items with new evidence
    → Logs context entries (ItemContextLog)
    → Updates mastery states (state machine transitions)
    → Updates pragmatic profile
    → Runs ToM analysis
    → Recalculates learner profile
    → Returns summary to UI → renders inline as summary card
```

### Structured Message Protocol

The agent's responses need to carry both conversation text and structured learning content. The system prompt instructs Claude to emit structured blocks using a simple markup convention that the frontend parses:

```
[VOCAB_CARD]
surface: 締め切り
reading: しめきり
meaning: deadline
example: あしたが締め切りです。
example_translation: Tomorrow is the deadline.
[/VOCAB_CARD]

ところで、最近何か締め切りある？仕事忙しそうだね。
```

The frontend parser splits agent messages into segments: plain text (rendered as normal chat bubbles) and structured blocks (rendered as cards). This keeps the API layer simple — Claude returns a single text string, the UI handles the display.

Card types for MVP:

| Tag | Purpose | Fields |
|---|---|---|
| `VOCAB_CARD` | Introduce new vocabulary | surface, reading, meaning, example, example_translation |
| `GRAMMAR_CARD` | Explain grammar pattern | pattern, meaning, example, example_translation, formation |
| `REVIEW_PROMPT` | Inline recall check | prompt, item_type, item_id |
| `CORRECTION` | Gentle error correction | incorrect, correct, explanation |
| `SESSION_SUMMARY` | End-of-session recap | (generated from analysis, not by Claude) |

### Session Planning — What Claude Receives

The system prompt for the conversation agent is already built (`buildConversationSystemPrompt` in `packages/core/src/conversation/planner.ts`). For the MVP, it needs one addition: instructions for emitting structured cards.

Addition to system prompt:

```
STRUCTURED CONTENT RULES:
When you introduce a new vocabulary item for the first time in this session, emit a [VOCAB_CARD] block before using it in conversation. When a target grammar pattern first appears, you may emit a [GRAMMAR_CARD] block. When you want to test the learner's recall of a previously introduced item, emit a [REVIEW_PROMPT] block. When you correct a learner error via recast, you may optionally emit a [CORRECTION] block.

These blocks appear inline in your response alongside your conversational text. Use them sparingly — 2-4 per session maximum. The conversation should still feel like a conversation, not a lesson. Most of the time, just talk naturally while engineering opportunities for the target items.
```

### Real-Time Challenge Tracking

The challenge card at the top of the conversation needs to update as the learner hits targets. Two approaches:

**Option A: Client-side detection.** The frontend scans each user message for target surface forms and grammar patterns. Simple regex/substring matching. Fast, no extra API calls. Works for vocabulary; unreliable for grammar patterns.

**Option B: Agent-assisted detection.** The system prompt asks Claude to include a hidden metadata line at the end of each response:

```
[TARGETS_HIT: 締め切り, ～てから]
```

The frontend parses this line (strips it from display) and updates the challenge card. More accurate than client-side regex, adds no latency (inline with the response).

**Recommendation: Option B.** It's more accurate and the cost is negligible (a few extra tokens per response). The frontend strips the metadata line before rendering.

---

## 4. Onboarding

A new learner needs a seeded knowledge model before the conversation loop is useful. The MVP onboarding flow is conversational — it happens IN the chat interface, not a separate wizard.

### Flow

1. **Welcome message.** "Welcome to Linguist. I'm going to help you learn Japanese. Let's figure out where you're starting from."

2. **Language selection.** (V1 is Japanese-only, but ask to confirm native language.)

3. **Self-report level.** "Have you studied Japanese before? Pick the closest description:" Rendered as clickable options in chat:
   - Complete beginner
   - I know hiragana/katakana and some basic words
   - I can handle simple daily conversations (N5)
   - I can follow most everyday topics (N4)
   - I can read general content with occasional lookups (N3+)

4. **Quick placement conversation.** 10-15 turns of actual conversation at the estimated level. The agent probes across vocabulary, grammar, and production. Not a test — a conversation with diagnostic intent. "自己紹介をしてください。" → gauge response → ask follow-ups that probe specific grammar.

5. **Seed the knowledge model.** Based on the placement conversation, the system:
   - Seeds vocabulary from curriculum data at and below the assessed level (mark as `introduced` or `apprentice_1`)
   - Seeds grammar patterns similarly
   - Creates the learner profile with computed levels
   - Errs on the side of generosity — better to mark items as known and let FSRS prove otherwise than to start with an empty model

6. **First real session.** Immediately transition into a planned conversation session. The learner experiences the product within 5 minutes of signing up.

### Implementation

The onboarding conversation uses the same chat UI as the main product. The backend tracks onboarding state on the User model (`onboardingCompleted: boolean`). When onboarding is incomplete, the chat interface uses an onboarding system prompt instead of the normal session planning flow.

After the placement conversation ends, a single API call:
- Analyzes the placement transcript
- Seeds lexical and grammar items from curriculum reference data
- Creates the learner profile
- Marks onboarding as complete
- Immediately plans the first real session

---

## 5. The Knowledge Model (MVP Scope)

### What's Tracked

The full schema is already built. For the MVP, the subset that matters:

**LexicalItem** — Every vocabulary item the learner has encountered or been seeded with. Key fields:
- `masteryState` — State machine position (unseen → burned)
- `recognitionFsrs` / `productionFsrs` — Separate FSRS scheduling states
- `exposureCount` / `productionCount` — How often seen vs. produced
- `contextTypes` / `contextCount` — Where and how often encountered

**GrammarItem** — Every grammar pattern tracked. Same mastery + FSRS structure.

**ChunkItem** — Collocations, chunks, pragmatic formulas. Tracked as units with component dependencies.

**ConversationSession** — Full transcript, session plan, analysis results, system prompt. The audit trail.

**TomInference** — Avoidance detection, confusion pairs, regression flags. Drives session planning.

**ReviewEvent** — Every mastery evidence event. Logged from both inline reviews and post-session analysis.

**ItemContextLog** — Per-interaction evidence with modality and success tracking.

### Mastery Evidence Sources in MVP

All evidence comes from or through the conversation:

| Source | Evidence Type | Weight |
|---|---|---|
| Learner produces target item spontaneously | Production, highest | FSRS "easy" equivalent |
| Learner produces target item after agent elicitation | Production, high | FSRS "good" equivalent |
| Learner answers inline review prompt correctly | Recognition or production | FSRS grade as selected |
| Learner answers inline review prompt incorrectly | Negative signal | FSRS "again" |
| Agent introduces item, learner uses it later in session | Production, medium | Logged to context, FSRS "good" |
| Agent introduces item, learner does not use it | Exposure only | Exposure count +1, no FSRS update |
| Learner avoids target item despite opportunity | Avoidance signal | TomInference created/updated |
| Learner makes error on item | Error signal | Logged to ItemContextLog, TomInference |

### State Machine Transitions in MVP

The full state machine (unseen → burned) applies, with one critical gate preserved: **items cannot advance past apprentice_4 to journeyman without production evidence from conversation.** In the MVP, all production evidence comes from conversation (there's no separate review drill), so this gate is naturally enforced.

Transitions are evaluated during post-session analysis:
- Unseen → Introduced: Agent presents item via VOCAB_CARD or natural usage
- Introduced → Apprentice_1: Learner engages with item (responds to review prompt, uses it once)
- Apprentice_N → Apprentice_N+1: FSRS recognition review graded good/easy
- Apprentice_4 → Journeyman: Production evidence logged (learner produced it in conversation)
- Journeyman → Expert: Consistent production + recognition over multiple sessions
- Expert → Master: Stable across 3+ distinct context types

---

## 6. Post-Session Analysis Pipeline

This is the critical loop that makes the knowledge model live. When a session ends, the following pipeline runs:

### Step 1: Transcript Analysis (Claude call)

Send the full transcript + session plan to Claude. Get back structured JSON:
- `targets_hit`: Item IDs successfully produced by the learner
- `errors_logged`: Errors with item ID, type, and context quote
- `avoidance_events`: Items the learner avoided despite opportunity
- `new_items_encountered`: Items used by the agent that were new to the learner
- `register_accuracy`: Correct uses vs. slips for the target register
- `strategy_events`: Circumlocutions, L1 fallbacks, silence events
- `context_logs`: Per-item interaction records with modality and success

This prompt and parser already exist: `buildAnalysisPrompt` and `parseAnalysis` in `packages/core/src/conversation/analyzer.ts`.

### Step 2: FSRS Updates

For each target hit:
- Update the item's `productionFsrs` with a "good" grade
- Increment `productionCount`
- Log a ReviewEvent with contextType "conversation"

For each error on a known item:
- Update the relevant FSRS track with an "again" or "hard" grade
- Log a ReviewEvent

For inline review responses (if any were answered during the session):
- Apply the learner's self-grade directly to FSRS

### Step 3: Mastery State Transitions

Evaluate each item touched in the session against the state machine rules. Promote or hold. Log transitions.

### Step 4: Context Logging

For each item interaction in `context_logs`, create an ItemContextLog entry. This builds the cross-context production history needed for Expert → Master transitions.

### Step 5: ToM Update

Run the ToM analyzer against the updated item states:
- Flag new avoidance patterns
- Detect confusion pairs from co-occurring errors
- Flag regressions
- Update or resolve existing inferences

### Step 6: Pragmatic Profile Update

Update the PragmaticProfile from register accuracy and strategy events.

### Step 7: Profile Recalculation

Recompute the learner's overall level, comprehension/production ceilings, and streak data.

### Implementation Note

All of steps 1-7 are already implemented in the desktop IPC handler (`apps/desktop/electron/ipc/conversation.ts`, lines ~400-700). The web `conversation/end` route needs to be extended with the same logic. The core functions are all in `packages/core/` and are framework-agnostic — they just need to be called from the web route with the right DB queries.

---

## 7. Technical Implementation Plan

### Phase 1: Wire the Learning Loop (Web)

**Goal:** Full conversation → analysis → knowledge update cycle working end-to-end on web.

1. **Extend `conversation/end` route** with the full post-analysis pipeline (steps 1-7 above). Port logic from the desktop handler, using core functions.

2. **Add streaming to `conversation/send`** route. Replace the blocking Anthropic call with streaming. Use Vercel AI SDK's `streamText` or stream raw SSE.

3. **Add structured message instructions** to the system prompt via `buildConversationSystemPrompt`. Define the VOCAB_CARD, GRAMMAR_CARD, REVIEW_PROMPT, CORRECTION markup convention.

4. **Add agent metadata line** (`[TARGETS_HIT: ...]`) instruction to the system prompt.

### Phase 2: Conversation-First UI

**Goal:** Single-screen conversation UI with rich message rendering and challenge tracking.

1. **Merge/replace the `/learn` and `/chat` pages** into a single conversation interface at the app root (or `/` after auth).

2. **Build the message parser** that splits agent responses into plain text segments and structured card blocks. Render cards as styled React components inline in the message flow.

3. **Build the challenge card** component. Reads targets from the session plan. Parses `[TARGETS_HIT]` metadata from each agent response. Shows real-time checkmarks.

4. **Build inline review interaction.** When a REVIEW_PROMPT card is rendered, the learner types in the chat input. The next message submission is routed as a review response → evaluated → FSRS updated → feedback rendered.

5. **Build the session summary card.** Rendered inline after `conversation/end` returns analysis results.

6. **Auto-session management.** On app open: if no active session, auto-plan one (loading state shows while planning). On session end: show summary card, then "Start new session" button that auto-plans the next one.

### Phase 3: Onboarding

**Goal:** New user goes from zero to first real conversation in under 5 minutes.

1. **Build onboarding system prompt** for the placement conversation.

2. **Build placement analysis** — analyze the onboarding transcript to assess level.

3. **Build seed logic** — given an assessed level, seed vocabulary and grammar items from curriculum reference data at appropriate mastery states.

4. **Wire the transition** — after seeding, immediately plan the first real session.

### Phase 4: Knowledge State View

**Goal:** Read-only view of the learner's knowledge model.

1. **Build a minimal stats page** accessible from the conversation header. Show mastery tier distribution, total items, current level, session history.

2. **Reuse existing components** — the desktop app and web app both have dashboard/frontier components that can be adapted.

### Phase 5: Polish and Validate

1. **Prompt tuning.** The session planning prompt, conversation system prompt, and analysis prompt all need iterative tuning based on real conversations. The structured card emission needs to feel natural, not forced.

2. **Error handling.** The analysis JSON parsing is brittle. Add fallback behavior when Claude returns malformed JSON.

3. **Cold start UX.** The first 3-5 sessions before the knowledge model is rich enough to drive meaningful planning. Ensure these sessions still feel valuable — lean on curriculum reference data to set targets even when the model is sparse.

4. **30-day validation.** Run the product with 3-5 real learners for 30 days. Measure: does the knowledge model grow accurately? Do session plans improve? Can the learner feel the difference?

---

## 8. What's Cut from MVP

Everything not listed above is explicitly out of scope:

- **Standalone SRS review sessions.** Inline review prompts in conversation replace this.
- **Separate lesson/curriculum page.** Curriculum delivery happens through the conversation agent.
- **Word bank browser with editing.** The knowledge state view is read-only.
- **Input feed (clips, mini-dramas, graded reading).** Content generation is limited to what the agent produces inline.
- **Multiple characters.** MVP ships with one character (Yuki, casual peer).
- **Session format rotation.** All sessions are conversation-style. Drop-in scenarios, debate mode, etc. come later.
- **Free practice mode.** Every session is planned. Free practice comes when the planned mode is validated.
- **Kanji track.** Deferred entirely.
- **Voice/audio.** Text only.
- **Desktop app parity.** Desktop continues to exist but is not the MVP deployment target.
- **Narrative engine / daily brief UI.** ToM brief runs silently for session planning. No user-facing narrative.

---

## 9. Success Criteria

### Must-hit for MVP validation

1. **Knowledge model accuracy.** After 10 sessions, manually audit 20 items from the learner's word bank. The mastery state should match a human evaluator's assessment for at least 80% of items.

2. **Session plan quality.** Compare session plans at session 5 vs. session 20. The later plan should reference specific items, avoidance patterns, and mastery gaps that did not exist at session 5. Plans should be qualitatively more targeted.

3. **Target hit rate.** Across all sessions, at least 40% of planned vocabulary targets and 30% of grammar targets should be naturally produced by the learner. (Lower than 40%/30% means the agent is failing to elicit; higher than 80% means targets are too easy.)

4. **Retention signal.** Items that were conversation targets (actively elicited) should show higher FSRS stability than items that were only passively encountered, after controlling for initial difficulty.

5. **Learner engagement.** The product should hold a motivated learner for 15+ sessions over 30 days. If learners drop off before session 10, the experience isn't compelling enough to validate the model.

### Nice-to-have signals

- Learner spontaneously reports that "the conversation knows what I need to practice"
- ToM avoidance detections match patterns the learner self-reports
- Session duration stays stable or grows over 30 days (not declining)
- The learner asks for more features (word bank, review mode, etc.) — signal that the core loop works and they want more

---

## 10. Open Questions for MVP

1. **Structured card frequency.** How many VOCAB_CARDs and GRAMMAR_CARDs per session before it stops feeling like a conversation? Initial guess: 2-4 total. Needs tuning.

2. **Inline review UX.** When the agent sends a REVIEW_PROMPT, how does the learner respond? In the normal chat input? A special "answer" mode? A button? The simplest approach: learner types their answer in the chat, agent evaluates it in the next turn. But this means the review is asynchronous (waits for a Claude round-trip to grade). Alternative: client-side matching for simple vocabulary, Claude for grammar.

3. **Session length management.** How does the agent know when to wind down? Options: (a) time-based — after 10-15 minutes, agent starts closing; (b) target-based — after all challenge targets have been attempted; (c) user-driven — learner hits "end session" when ready. Recommendation: (c) with (b) as a gentle nudge ("We've hit all your challenges today — want to keep chatting or wrap up?").

4. **Multiple sessions per day.** Can a learner start a second session after completing one? Yes — the system plans a new session each time. But the second session in a day should not re-target items already hit today. The planner needs a "sessions today" filter.

5. **Offline / error recovery.** What happens if the learner's connection drops mid-session? The transcript is persisted to DB on every message exchange, so no data is lost. The session can be resumed by reloading the page and continuing from the stored transcript.

6. **Handling very early sessions (day 1-3).** The knowledge model is sparse. The ToM has no inferences. The curriculum recommendations are generic. These sessions need to feel valuable despite limited personalization. Lean on the curriculum spine: use Unit 1-3 vocabulary as targets. Accept that early sessions are more "lesson in chat" than "targeted conversation."
