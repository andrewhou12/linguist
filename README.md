# Linguist

A desktop language learning agent that builds a living knowledge model of the learner. Every interaction — reviews, conversations, lookups — updates a probabilistic map of what the learner knows, and the app uses that to decide what they should encounter next.

V1 target: Japanese. Text-only (voice in V2).

## Stack

- **Desktop:** Electron
- **Frontend:** React + TypeScript + Radix UI
- **Database:** Supabase (local via CLI) + Prisma ORM
- **AI:** Claude Sonnet (conversation partner, session planning, post-session analysis)
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
npx prisma migrate dev --name init

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

```
User action (review, conversation, lookup)
      ↓
Event logged to DB
      ↓
Learner profile updated (FSRS state, mastery state machine, error patterns)
      ↓
ToM engine infers higher-level beliefs (daily brief)
      ↓
Conversation agent reads brief → plans next session
```

### Project Structure

```
linguist/
├── core/                    # Pure business logic (no Electron/React/Prisma deps)
│   ├── fsrs/                # FSRS scheduler wrapper
│   ├── mastery/             # Mastery state machine (unseen → burned)
│   ├── tom/                 # Theory of Mind engine (avoidance, confusion, regression)
│   └── conversation/        # Prompt construction for session planning & analysis
├── electron/                # Electron main process
│   ├── main.ts              # App entry, window management
│   ├── preload.ts           # Context bridge (exposes IPC as window.linguist)
│   ├── db.ts                # Prisma client singleton
│   └── ipc/                 # IPC handlers (one file per domain)
├── src/                     # React renderer
│   ├── app.tsx              # Root component with routing
│   ├── components/          # Shared UI (app shell, sidebar)
│   ├── pages/               # Dashboard, Review, Conversation, Word Bank, Insights
│   └── hooks/               # IPC data hooks
├── shared/
│   └── types.ts             # TypeScript types shared across all layers
├── prisma/
│   └── schema.prisma        # Database schema (6 models)
└── supabase/                # Local Supabase config
```

**Boundary rules:**
- `core/` is pure TypeScript — trivially testable, no framework deps
- `electron/ipc/` is the only layer that touches Prisma and calls `core/`
- `src/` (renderer) accesses data only through `window.linguist` IPC hooks
- `shared/types.ts` is the one file importable everywhere

### Database Models

| Model | Purpose |
|---|---|
| `LearnerProfile` | Target/native language, daily limits, retention target |
| `LexicalItem` | Vocabulary with separate recognition/production FSRS states |
| `GrammarItem` | Grammar patterns with FSRS states |
| `ReviewEvent` | Every review graded (again/hard/good/easy) |
| `ConversationSession` | Transcript, planned targets, hits, errors, avoidance |
| `TomInference` | System beliefs about the learner (avoidance, confusion pairs, regression) |

### Mastery State Machine

```
unseen → introduced → apprentice_1 → apprentice_2 → apprentice_3 → apprentice_4
    → journeyman* → expert → master → burned
```

*Journeyman requires production evidence — items cannot advance past apprentice_4 without a logged production event (conversation or production drill).

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...    # Required for conversation & ToM
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

## Current Status

See [claude/progress.md](claude/progress.md) for detailed progress log.

**Working:** Full build pipeline, Prisma schema, core business logic (FSRS, mastery state machine, ToM detectors), IPC wiring, React shell with routing and sidebar.

**Not yet built:** Supabase migration (needs Docker), conversation Claude API integration, review card UI, onboarding/placement flow, word bank detail views, insights display.
