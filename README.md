# Linguist

A desktop language learning agent that builds a living, probabilistic knowledge model of the learner. Every interaction — reviews, conversations, lookups — updates a multi-dimensional map of what the learner knows, and the app uses that map to decide what they should encounter next.

V1 target: Japanese. Text-only (voice in V2).

## Why Linguist Exists

Most language learning apps treat learners as interchangeable. Duolingo follows a fixed curriculum. Anki tracks card-level recall but has no concept of the learner as a whole. Conversation apps like Langua offer freeform practice but don't know what you're weak on.

Linguist's core thesis: **the learner profile is the product**. The app maintains a rich, multi-layered model of what you know, what you're shaky on, what you avoid, and where you're ready to grow — and every feature reads from and writes to that model.

### What Makes It Different

**Knowledge model, not a card deck.** Items aren't just "due" or "not due." Each item tracks mastery state, recognition vs. production strength, accumulated production weight, context breadth (how many distinct contexts you've used it in), and per-modality exposure (reading, writing, listening, speaking). Promotion through mastery tiers is gated by evidence: you can't reach journeyman without production, expert without context breadth, or master without demonstrating transfer to novel contexts.

**Theory of Mind engine.** The system infers higher-level beliefs about the learner beyond raw review data: avoidance patterns (items you drill but never use in conversation), confusion pairs (items that co-occur in errors), regression (previously stable items slipping), modality gaps (strong reading but weak writing), and transfer gaps (grammar patterns only used in the context where they were first learned). These inferences feed directly into session planning.

**Conversation partner with goals.** The AI conversation partner isn't generic — it reads the learner profile before every session and has explicit targets. It engineers natural moments to elicit specific vocabulary and grammar from the learner, tracks register usage, notes circumlocution as a positive strategy, and runs post-session analysis to update the knowledge model. Every conversation produces structured data that makes the next one better.

**Curriculum generator (i+1).** Instead of a fixed syllabus, the curriculum engine computes a "knowledge bubble" — a per-JLPT-level breakdown of what you know — identifies your current level and frontier, and recommends items just beyond your edge using Krashen's i+1 principle. Recommendations are scored by frequency, gap-filling priority, prerequisite readiness, and ToM signals.

**Pragmatic competence tracking.** Beyond vocabulary and grammar, the system tracks pragmatic skills: register accuracy (casual vs. polite), communication strategies (circumlocution, L1 fallback, silence), and avoided patterns. This is Layer 3 of the knowledge model — the dimension most apps ignore entirely.

## Stack

- **Desktop:** Electron
- **Frontend:** React + TypeScript + Radix UI
- **Database:** Supabase (local via CLI) + Prisma ORM
- **AI:** Claude Sonnet (conversation partner, session planning, post-session analysis, pragmatic analysis)
- **SRS:** FSRS (ts-fsrs), runs fully locally

## Prerequisites

- Node.js 20+
- [Docker Desktop](https://docs.docker.com/desktop/) (required for local Supabase)

## Getting Started

```bash
# Install dependencies
npm install

# Start local Supabase (Docker must be running)
npx supabase start

# Run database migration
npx prisma migrate dev

# Copy env and add your API key
cp .env.example .env
# Edit .env → set ANTHROPIC_API_KEY

# Start the app in dev mode
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launch Electron app with hot reload |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check (all) |
| `npm run typecheck:node` | TypeScript check (main/preload/core) |
| `npm run typecheck:web` | TypeScript check (renderer) |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run db:generate` | Regenerate Prisma client |

## Architecture

### Data Flow

```
User action (review, conversation, lookup)
      ↓
Event logged to DB (ReviewEvent + ItemContextLog)
      ↓
Learner profile updated
  ├── FSRS state (recognition + production, per item)
  ├── Mastery state machine (evidence-gated promotions)
  ├── Modality counters (reading/writing/listening/speaking)
  ├── Context breadth (distinct context types per item)
  └── Production weight (accumulated, drill=0.5 conversation=1.0)
      ↓
ToM engine infers higher-level beliefs
  ├── Avoidance detection
  ├── Confusion pair detection
  ├── Regression detection
  ├── Modality gap detection
  └── Transfer gap detection
      ↓
Curriculum generator computes knowledge bubble + i+1 recommendations
      ↓
Conversation agent reads profile + ToM brief + curriculum
  → Plans session with specific targets
  → Conducts conversation with behavioral rules
  → Post-session: analyzes transcript, updates knowledge model
  → Pragmatic analysis: register accuracy, strategies, avoided patterns
      ↓
Profile recalculated (JLPT ceilings, skill levels, streaks)
```

### Three-Layer Knowledge Model

**Layer 1 — Item-level knowledge:** Each vocabulary and grammar item has a mastery state, dual FSRS states (recognition/production), accumulated production weight, context breadth, and per-modality exposure counts. Mastery promotion is gated by evidence:

| Transition | Gate |
|---|---|
| apprentice_4 → journeyman | Production weight >= 1.0 |
| journeyman → expert | Context count >= 3 |
| expert → master | Novel context count >= 2 (grammar) |

**Layer 2 — Aggregate competence:** The profile calculator computes JLPT-level ceilings from item-level data. Comprehension ceiling = highest level where avg recognition retrievability > 0.80. Production ceiling = highest where avg production retrievability > 0.60. The curriculum generator uses these to identify the frontier level and recommend i+1 items.

**Layer 3 — Pragmatic competence:** Register accuracy (casual/polite), communication strategies (circumlocution, L1 fallback, silence), and avoided patterns. Updated after each conversation session via exponential moving average.

### Project Structure

```
linguist/
├── core/                        # Pure business logic (no Electron/React/Prisma deps)
│   ├── fsrs/                    # FSRS scheduler wrapper
│   ├── mastery/                 # Mastery state machine (evidence-gated transitions)
│   ├── tom/                     # Theory of Mind engine (5 detectors + expanded brief)
│   ├── conversation/            # Prompt construction for planning, conversation, analysis
│   ├── profile/                 # Profile calculator (JLPT ceilings, skill levels, streaks)
│   ├── curriculum/              # Knowledge bubble + i+1 recommender
│   │   └── data/                # Static JLPT reference corpus (japanese-reference.json)
│   └── pragmatics/             # Pragmatic competence analysis (register, strategies)
├── electron/                    # Electron main process
│   ├── main.ts                  # App entry, window management, 8 IPC handler groups
│   ├── preload.ts               # Context bridge (exposes IPC as window.linguist)
│   ├── db.ts                    # Prisma client singleton
│   └── ipc/                     # IPC handlers (one file per domain)
│       ├── reviews.ts           # Review queue, submit, summary + context logging
│       ├── wordbank.ts          # Word bank CRUD
│       ├── conversation.ts      # Full Claude API integration (plan → chat → analysis)
│       ├── tom.ts               # 5-detector ToM analysis + inference storage
│       ├── profile.ts           # Profile CRUD + recalculation
│       ├── curriculum.ts        # Knowledge bubble + recommendations + introduce/skip
│       ├── pragmatics.ts        # Pragmatic state get/update
│       └── context-log.ts       # Context log list/add
├── src/                         # React renderer
│   ├── app.tsx                  # Root component with routing
│   ├── components/              # Shared UI (app shell, sidebar)
│   ├── pages/                   # Dashboard, Review, Conversation, Word Bank, Insights
│   └── hooks/                   # IPC data hooks
├── shared/
│   └── types.ts                 # TypeScript types shared across all layers (26 IPC channels)
├── prisma/
│   └── schema.prisma            # Database schema (9 models)
└── supabase/                    # Local Supabase config
```

**Boundary rules:**
- `core/` is pure TypeScript — trivially testable, no framework deps
- `electron/ipc/` is the only layer that touches Prisma and calls `core/`
- `src/` (renderer) accesses data only through `window.linguist` IPC hooks
- `shared/types.ts` is the one file importable everywhere

### Database Models

| Model | Purpose |
|---|---|
| `LearnerProfile` | Computed levels, modality skills, streaks, pattern summaries |
| `LexicalItem` | Vocabulary with dual FSRS, context breadth, modality counters, production weight |
| `GrammarItem` | Grammar patterns with FSRS, prerequisites, novel context tracking |
| `ReviewEvent` | Every review graded with production weight and context type |
| `ConversationSession` | Transcript, planned targets, hits, errors, avoidance |
| `TomInference` | System beliefs (avoidance, confusion, regression, modality gap, transfer gap) |
| `ItemContextLog` | Every context encounter per item (SRS, conversation, reading, drill) |
| `PragmaticProfile` | Register accuracy, communication strategies, avoided patterns |
| `CurriculumItem` | Queued i+1 recommendations with priority scoring |

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...    # Required for conversation & analysis
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

## Progress

See [progress/](progress/) for detailed session logs.

## Current Status

**Working:** Full build pipeline, 9-model Prisma schema, three-layer knowledge model, evidence-gated mastery state machine, FSRS scheduler, 5-detector ToM engine, curriculum generator with i+1 recommendations, pragmatic competence tracking, full conversation pipeline with Claude API integration (planning + chat + post-session analysis + pragmatic analysis), context logging, profile calculator, 26 IPC channels across 8 domains, React shell with routing.

**Not yet built:** Review card UI, onboarding/placement flow, word bank detail views, insights/curriculum/profile UI pages, voice pipeline (V2).
