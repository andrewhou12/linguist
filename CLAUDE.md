# Linguist — Claude Code Instructions (V1)

## What We're Building

Linguist is a desktop-first language learning agent. Its core idea: the learner has a **knowledge state**, and every interaction updates it. The app always knows where the learner is and uses that to decide what they should encounter next.

V1 goal: a working daily-use app that proves the knowledge model works. A learner who uses it for 30 days should have a demonstrably more accurate, personalized knowledge model — and the conversation agent's session plans should visibly improve over time.

**Target stack:** Electron + React + TypeScript + Supabase (local) + Prisma ORM

---

## Architecture Overview

### Core Principle
The **learner profile** is the product. Everything reads from it; everything writes to it. It is not a user account — it is a living probabilistic map of the learner's competence.

### App Stack
- **Desktop framework:** Electron (cross-platform, Node.js backend in main process)
- **Frontend:** React + TypeScript with Radix UI primitives for accessibility
- **DB:** Supabase (local, via Supabase CLI) — Postgres + Supabase client. No bundled Postgres binary needed.
- **ORM:** Prisma — used for type-safe DB access in the Electron main process. Supabase client used for realtime/auth in future versions.
- **AI layer:** Claude Sonnet API — used for the conversation partner, ToM engine, and session planning
- **SRS engine:** FSRS implemented in TypeScript, runs fully locally

### File Structure

```
linguist/
├── electron/
│   ├── main.ts              # App entry, window management, Supabase start/stop
│   ├── preload.ts           # Context bridge — exposes IPC to renderer safely
│   └── ipc/                 # IPC handlers (one file per domain)
│       ├── reviews.ts
│       ├── conversation.ts
│       ├── wordbank.ts
│       └── tom.ts
├── src/                     # React renderer (Vite)
│   ├── app.tsx
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── review/
│   │   ├── conversation/
│   │   ├── wordbank/
│   │   └── insights/
│   ├── components/          # Shared UI components
│   └── hooks/               # Data fetching hooks (call IPC, not DB directly)
├── core/                    # Business logic — imported by electron/ipc/, never by src/
│   ├── fsrs/                # FSRS scheduler
│   ├── tom/                 # ToM engine
│   ├── conversation/        # Session planning, post-session analysis
│   └── mastery/             # State machine
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── supabase/                # Supabase CLI project (config.toml, seed.sql etc.)
├── shared/
│   └── types.ts             # TypeScript types shared across electron/ src/ core/
└── package.json             # Single package.json — not a monorepo
```

**Structural rules:**
- `core/` has zero dependency on Electron, React, or Prisma — pure TypeScript functions that take data in and return data out. Trivially testable, extractable later if needed.
- `electron/ipc/` is the only layer that touches Prisma and calls `core/`. No business logic lives here — it wires DB access to core functions and exposes results over IPC.
- `src/` (renderer) never imports from `core/` or `electron/` directly. All data access goes through IPC hooks. This enforces the main/renderer process boundary and keeps the security model clean.
- `shared/types.ts` is the one file importable everywhere — TypeScript interfaces and enums only, no logic.

**Why not a monorepo (Turborepo/nx)?** There are no independently deployable packages here — just one desktop app. A single `package.json` with clear folder conventions gives 90% of the organizational benefit with none of the tooling complexity. If `core/` is later extracted as a publishable package (e.g. to share the FSRS implementation), that migration is straightforward.

### High-Level Data Flow
```
User action (review, conversation, hover-lookup)
        ↓
Event logged to DB
        ↓
Learner profile updated (FSRS state, mastery state machine, error/avoidance patterns)
        ↓
ToM engine infers higher-level beliefs (daily brief)
        ↓
Conversation agent reads brief → plans next session
```

---

## Database Schema

Use Prisma ORM against a local Supabase instance. No auth in V1.

### Local Supabase Setup
```bash
# Install and start local Supabase
npx supabase init
npx supabase start

# Supabase local studio runs at http://localhost:54323
# Postgres connection string (from `supabase start` output):
# postgresql://postgres:postgres@localhost:54322/postgres
```

Prisma connects directly to the local Supabase Postgres instance. The Supabase client library is not needed in V1 (no auth, no realtime) — Prisma handles all DB access.

```
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

All DB access goes through Prisma in the **Electron main process** only. Renderer communicates via IPC (`ipcMain` / `ipcRenderer`). Never import Prisma directly in renderer code.

### Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model LearnerProfile {
  id                 Int      @id @default(1)
  targetLanguage     String
  nativeLanguage     String
  dailyNewItemLimit  Int      @default(10)
  targetRetention    Float    @default(0.90)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model LexicalItem {
  id              Int             @id @default(autoincrement())
  surfaceForm     String
  reading         String?
  meaning         String
  partOfSpeech    String?
  masteryState    String          @default("unseen")
  recognitionFsrs Json            // { R, S, D, due_date }
  productionFsrs  Json            // { R, S, D, due_date }
  firstSeen       DateTime        @default(now())
  lastReviewed    DateTime?
  exposureCount   Int             @default(0)
  productionCount Int             @default(0)
  tags            String[]
  source          String          @default("manual")
  reviewEvents    ReviewEvent[]
}

model GrammarItem {
  id              Int           @id @default(autoincrement())
  patternId       String        @unique
  name            String
  description     String?
  jlptLevel       String?
  masteryState    String        @default("unseen")
  recognitionFsrs Json
  productionFsrs  Json
  firstSeen       DateTime      @default(now())
  lastReviewed    DateTime?
  reviewEvents    ReviewEvent[]
}

model ReviewEvent {
  id            Int          @id @default(autoincrement())
  itemType      String       // "lexical" | "grammar"
  grade         String       // "again" | "hard" | "good" | "easy"
  modality      String       // "recognition" | "production" | "cloze"
  timestamp     DateTime     @default(now())
  sessionId     String?
  lexicalItem   LexicalItem? @relation(fields: [lexicalItemId], references: [id])
  lexicalItemId Int?
  grammarItem   GrammarItem? @relation(fields: [grammarItemId], references: [id])
  grammarItemId Int?
}

model ConversationSession {
  id              String   @id @default(uuid())
  timestamp       DateTime @default(now())
  durationSeconds Int?
  transcript      Json     // [{ role, content, timestamp }]
  targetsPlanned  Json     // { vocabulary: Int[], grammar: Int[] }
  targetsHit      Json     // Int[]
  errorsLogged    Json     // [{ itemId, errorType, contextQuote }]
  avoidanceEvents Json     // [{ itemId, contextQuote }]
  sessionPlan     Json     // pre-session brief
}

model TomInference {
  id            Int      @id @default(autoincrement())
  type          String   // "avoidance" | "confusion_pair" | "regression" | "modality_gap"
  itemIds       Int[]
  confidence    Float
  description   String
  firstDetected DateTime @default(now())
  lastUpdated   DateTime @updatedAt
  resolved      Boolean  @default(false)
}
```

---

## Mastery State Machine

Every lexical and grammar item progresses through these states. **State transitions are gated by evidence, not time.**

| State | Entry Condition | Review Interval |
|---|---|---|
| `unseen` | Default | — |
| `introduced` | First exposure (in conversation or curriculum) | — |
| `apprentice_1` | Added to SRS | 1 day |
| `apprentice_2` | Correct recognition review | 2 days |
| `apprentice_3` | Correct recognition review | 4 days |
| `apprentice_4` | Correct recognition review | 8 days |
| `journeyman` | **Requires production evidence** (produced correctly in conversation or production drill) | 14–30 days |
| `expert` | Consistent production + recognition | 1–3 months |
| `master` | Stable across all reviewed modalities | 3–12 months |
| `burned` | Correct recall after 4+ months gap | Removed from active rotation |

**Critical rule:** Items cannot advance past `apprentice_4` to `journeyman` without a logged production event. The system must create a context (conversation target or production drill) to generate that evidence.

---

## FSRS Implementation

Use FSRS (Free Spaced Repetition Scheduler) — do **not** implement SM-2.

- Source the open-source TypeScript implementation of FSRS
- Initialize with pre-trained default parameters (optimized on 700M reviews)
- Begin per-user personalization after ~50 reviews per item type
- Target retention: 90% (expose as setting, range 80–97%)
- Recognition and production FSRS states are tracked **separately** per item
- The review queue is computed at app startup and cached locally — no network dependency

Grade mapping for FSRS input:
- `again` → 1
- `hard` → 2  
- `good` → 3
- `easy` → 4

---

## V1 Feature Specifications

### 1. Onboarding & Placement

**Goal:** Populate the initial `learner_profile`, `lexical_items`, and `grammar_items` with a baseline state so the knowledge model has something to work with from day one.

**Flow:**
1. Select target language (V1: Japanese only) and native language
2. Self-report level (beginner / N5 / N4 / N3 / N2 / N1)
3. Short placement test: 30–50 items covering vocabulary and grammar across levels; grade responses to set initial mastery states
4. Set daily new item limit (default: 10) and session time target (default: 15–20 min)

**Output:** learner_profile row created; ~50–200 lexical_items and ~20–40 grammar_items seeded with appropriate initial mastery states based on placement results.

---

### 2. Word Bank

A browsable, searchable ledger of all items in the learner's `lexical_items` table.

**Views:**
- All items, filterable by mastery state and tag
- Due for review (items with `recognition_fsrs.due_date` or `production_fsrs.due_date` ≤ today)
- Recently added
- Search by surface form, reading, or meaning

**Per-item detail view shows:**
- Surface form, reading, meaning, part of speech
- Mastery state (with visual indicator)
- First seen date, exposure count, production count
- Current FSRS state: R (retrievability %), S (stability in days), D (difficulty 1–10)
- Tags (editable)
- Recent review history

**Actions:**
- Manually add item to SRS (sets state to `apprentice_1`)
- Edit meaning or tags
- Mark as burned (user override)

---

### 3. SRS Review Engine

The daily anchor habit. Fast, clean, locally computed.

**Review types for V1:**
- **Recognition:** Show target item → recall meaning/reading
- **Production:** Show meaning/reading → produce the target item (typed)
- **Cloze:** Show sentence with target blanked → fill in the blank

**Session flow:**
1. At app open, compute today's review queue: all items with `due_date` ≤ today, sorted by overdue duration
2. Cap at 200 due reviews per session (debt management)
3. New items introduced only after due reviews are cleared, up to daily limit
4. For each card: show prompt → user responds → user self-grades (Again / Hard / Good / Easy) → FSRS updates immediately → next card

**After review:**
- Update `recognition_fsrs` or `production_fsrs` on the item
- Log a `review_events` row
- If production review was graded Good or Easy and item is in `apprentice_4` state: flag for journeyman promotion (requires conversation production evidence to fully confirm, but production drill counts as weak evidence — see open questions)

**Session summary screen:** items reviewed, accuracy rate, new items added, mastery state changes.

---

### 4. Conversation Partner

This is Linguist's primary differentiator. The agent reads the learner profile before every session and has **explicit goals** derived from it.

#### Pre-Session Planning

Before the conversation starts, run a planning step (separate API call):

```
System: You are a session planner for a language learning agent.
Given the learner profile below, generate a session plan.

The plan must include:
- target_vocabulary: 3–5 item IDs from apprentice/journeyman tier not yet produced in conversation
- target_grammar: 1–2 pattern IDs flagged as avoidance or confusion patterns
- difficulty_level: the learner's current level + 1 tier
- register: [casual | polite] based on learner's target
- session_focus: one sentence describing the session's theme

Learner profile: [serialized profile summary]
ToM daily brief: [serialized tom_inferences, unresolved only]
```

Store the session plan in `conversation_sessions.session_plan`.

#### Main Conversation System Prompt

```
You are a language conversation partner for a [target_language] learner.

LEARNER PROFILE SUMMARY:
- Level: [computed level]
- Native language: [native_language]
- Current session targets: [target_vocabulary], [target_grammar]
- Output complexity: [difficulty_level]
- Register: [register]
- Known avoidance patterns: [list]
- Known confusion pairs: [list]

BEHAVIORAL RULES:
1. Speak primarily in [target_language] at the specified difficulty level.
2. Engineer natural conversational moments to elicit the target vocabulary and grammar from the learner. Do not force them — create contexts where they arise naturally.
3. When the learner makes a production error, correct via recasting: use the correct form naturally in your next utterance without explicitly pointing out the error. Do not break conversational flow to correct unless the error causes miscommunication.
4. If the learner uses their native language instead of [target_language], note it and gently redirect without shaming.
5. Track internally when a target item has been successfully produced by the learner. Acknowledge success subtly.
6. Do not exceed the difficulty level — monitor your own lexical and grammatical complexity.
```

#### Post-Session Analysis

After the conversation ends, run a second API call to analyze the transcript:

```
Analyze this conversation transcript and return JSON:
{
  "targets_hit": [item_ids successfully produced],
  "errors_logged": [{ item_id, error_type, context_quote }],
  "avoidance_events": [{ item_id, context_quote }],
  "new_items_encountered": [{ surface_form, context_quote }],
  "overall_assessment": "one sentence"
}

Transcript: [full transcript]
Session plan: [session plan JSON]
```

Use the output to:
- Update `production_count` on hit items
- Log errors and avoidance events to `tom_inferences`
- Update mastery states for items with new production evidence
- Add newly encountered items to `lexical_items` as `introduced`

---

### 5. Theory of Mind Engine (Basic)

Runs on a schedule (e.g., after each conversation session, or daily on app open). Reads the DB and writes/updates `tom_inferences`.

**V1 inferences to implement:**

**Avoidance detection:**
- If an item has been in `journeyman` state for 3+ sessions and has 0 production events from conversation (only from drills), flag as `avoidance`.

**Confusion pair detection:**
- If two items are both flagged with errors in the same sessions more than twice, flag as `confusion_pair` between them.

**Regression detection:**
- If a `master` or `expert` item has been graded `again` or `hard` in the last 3 reviews, flag as `regression`.

**Daily brief generation:**
The ToM engine's output is a plain-text + JSON brief injected into the session planning prompt. Format:

```json
{
  "priority_targets": [{ item_id, reason }],
  "confusion_pairs": [{ item_ids, description }],
  "avoidance_patterns": [{ item_id, sessions_avoided }],
  "regressions": [{ item_id, recent_grades }],
  "recommended_difficulty": "N4",
  "notes": "Learner has avoided て-form in conversation for 4 sessions despite drilling it in SRS."
}
```

---

## Context Window Management

The learner profile grows over time. Manage it carefully:

**Serialization tiers for API calls:**
- **Active items** (apprentice/journeyman): full detail — surface form, reading, meaning, mastery state, FSRS state, recent errors
- **Stable items** (expert/master): summary only — count by mastery tier, any flagged regressions
- **Burned items**: aggregate count only

**Target profile injection size:** < 8,000 tokens for the full session prompt including conversation history.

**Conversation context window:** Keep the last 20–30 turns of conversation history in context. Summarize older turns if needed.

---

## V1 UI Structure (React + Electron)

```
App shell (sidebar navigation)
├── Dashboard (today's due reviews, streak, next session prompt)
├── Review (SRS review engine)
├── Conversation (chat interface + session plan display)
├── Word Bank (searchable ledger)
├── Profile (learner settings, level assessment, stats)
└── Insights (ToM inferences — what the system has learned about the learner)
```

Use Radix UI primitives for all interactive components. Keep the interface clean and fast — review sessions should feel instant.

---

## Environment & Configuration

```
ANTHROPIC_API_KEY=...       # Required for conversation and ToM engine
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

Supabase runs locally via the CLI — start it with `npx supabase start` before launching the Electron app. Supabase data persists in the project's `.supabase/` directory. Use `npx supabase db reset` to wipe and re-migrate during development.

**Auth:** Skipped for V1. When added, use Supabase Auth — the local instance includes it out of the box.

FSRS scheduling runs fully locally — no network calls for review sessions.

---

## V1 Success Metrics

- A learner using the app daily for 30 days has a measurably richer knowledge model than on day 1
- The conversation agent's session plans reference specific items from the learner's profile (not generic suggestions)
- Review sessions complete in < 20 minutes for a standard daily queue
- The word bank accurately reflects what the learner knows vs. is shaky on
- Post-session analysis correctly identifies at least 80% of target vocabulary hits

---

## Voice Layer (V2)

V1 is text-only. When voice is added in V2, use a modular STT → LLM → TTS pipeline rather than an end-to-end speech model. This preserves LLM flexibility (swap Claude for another model, update independently) and gives explicit control over each layer — important for a learning app where accuracy and voice quality directly affect learning outcomes.

### Pipeline Architecture
```
Microphone input
      ↓
STT (speech-to-text) → transcript text
      ↓
LLM (Claude) → response text  [reads learner profile, session plan as before]
      ↓
TTS (text-to-speech) → audio output
      ↓
Speaker output + transcript logged to DB
```

### STT: `gpt-4o-mini-transcribe` (start here)
- Best-in-class accuracy for Japanese — significantly fewer hallucinations than Whisper V3 in noisy conditions
- Hosted, no infra to manage for V2
- If cost becomes an issue at scale: migrate to self-hosted **faster-whisper** (C++ port of Whisper Large V3 Turbo, ~6x faster than base Whisper, runs locally)

### TTS: ElevenLabs Flash v2.5 (start here)
- Sub-100ms TTFB, 30+ languages including Japanese
- Voice quality is the industry benchmark — Langua's "cloned from native speaker" voices are almost certainly ElevenLabs
- For a language learning app specifically, voice naturalness matters: learners are training their listening comprehension against the TTS output. Do not cut corners here for cost in V2.
- If latency becomes the bottleneck at scale: evaluate **Cartesia Sonic** (40–90ms TTFA, ~73% cheaper, slightly lower naturalness)

### Why Not OpenAI Realtime API
The Realtime API (speech-to-speech, no explicit STT/TTS step) is explicitly **not recommended** for Linguist:
- Locks the entire pipeline to OpenAI — no ability to swap in Claude or adjust the LLM independently
- No access to the intermediate transcript, which Linguist needs to log errors, update the learner profile, and run post-session analysis
- Japanese handling mid-conversation is reportedly inconsistent
- No control over TTS voice quality

### Latency Budget (target for V2)
| Stage | Target |
|---|---|
| STT (gpt-4o-mini-transcribe) | < 400ms |
| LLM first token (Claude Sonnet, streaming) | < 500ms |
| TTS first audio chunk (ElevenLabs Flash) | < 100ms |
| **Total time to first audio** | **< 1s** |

Langua's primary user complaint is latency breaking conversational flow. Design the V2 voice pipeline with streaming at every stage — stream LLM tokens into TTS as they arrive, don't wait for the full response.

### Voice-Specific Learner Profile Updates
When voice is added, the post-session analysis needs to capture additional signal:
- **Pronunciation errors:** flagged by comparing STT transcript against intended utterance
- **Hesitation events:** long silences mid-utterance logged as fluency signals
- **L1 intrusion:** detected when STT returns English mid-Japanese utterance
- **Speaking pace:** words-per-minute tracked per session, trended over time

---

## What's Out of Scope for V1

- Auto-generated curriculum / chapter generation (V2)
- Reading assist / ambient hover-lookup (V2)
- Listening assist (V3)
- Cloud sync (V3)
- Multi-language support beyond Japanese (V3)
- Local model inference (V3)
- Voice/audio in conversation — see Voice Layer (V2) section above for planned approach
- Community vocabulary lists (V3)

---

## Open Questions to Resolve Early

1. **Production grading:** Does a correct fill-in-the-blank drill count as production evidence for journeyman promotion? Recommended default: yes, but weighted at 0.5x vs. conversation production. Implement a `production_weight` field on review events.

2. **Review debt cap:** If a learner returns after 2 weeks away, show max 150 due reviews. Remaining items have their due dates reset forward by the absence duration (vacation mode). Implement from day one.

3. **Placement test cold start:** New users with empty word banks need a good first-session experience before the knowledge model is rich. Seed the word bank generously from the placement test results — err on the side of marking things as `introduced` rather than leaving the bank empty.