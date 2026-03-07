# Lingle

A generative language practice engine. Describe what you want to practice, and the AI builds a structured, realistic session around it — text or voice. One prompt creates a conversation partner with a personality, a setting, target vocabulary, and a difficulty ceiling. Every session is novel, every session has a plan.

V1 target: Japanese. Voice + text.

## Why Lingle Exists

Most language learning apps treat learners as interchangeable. Duolingo follows a fixed curriculum. Anki tracks card-level recall but has no concept of the learner as a whole. Conversation apps offer freeform practice but don't know what you're weak on.

Lingle's approach: **generative practice environments built from a single prompt.** Instead of pre-written exercises, the AI generates custom sessions — a ramen shop owner who speaks in dialect, a job interviewer using keigo, a friend planning a weekend trip — calibrated to the learner's exact level.

### What Makes It Different

**Generative, not a content library.** "Practice ordering food" creates a different restaurant, a different server personality, different conversational wrinkles every time. The learner controls the curriculum by describing what they need.

**Four modes, one engine.** Conversation practice, structured lessons, immersion exercises, and reference explanations all flow from the same AI engine. A conversation can become a mini-lesson. A lesson can become practice.

**Voice-first trajectory.** Push-to-talk voice conversations with streaming STT → LLM → TTS pipeline. The AI speaks back sentence-by-sentence as it generates. Text remains fully functional alongside voice.

**Invisible difficulty.** Six calibrated levels control vocabulary, grammar, kanji density, furigana, English support, and register. Set it once — everything adapts.

**Corrections through recasting.** When the learner makes a mistake, the AI uses the correct form naturally in its response. Corrections appear as visual overlays without breaking conversational flow.

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Web app:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Auth:** Supabase Auth (Google OAuth) via `@supabase/ssr`
- **Database:** Hosted Supabase (Postgres) + Prisma ORM
- **AI:** Claude Sonnet 4 (conversation), Claude Haiku 4.5 (session planning)
- **Voice STT:** Soniox stt-rt-v4 (realtime streaming Japanese transcription)
- **Voice TTS:** OpenAI tts-1 (→ ElevenLabs Flash planned)
- **Payment:** Stripe (checkout, billing portal, webhooks)
- **AI SDK:** Vercel AI SDK for streaming

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy env and add your keys
cp .env.example .env

# For the web app, create apps/web/.env.local:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
#   DATABASE_URL=your-database-url
#   ANTHROPIC_API_KEY=your-api-key
#   SONIOX_API_KEY=your-soniox-key
#   STRIPE_SECRET_KEY=sk_...
#   STRIPE_WEBHOOK_SECRET=whsec_...
#   STRIPE_PRICE_ID=price_...
#   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
#   NEXT_PUBLIC_APP_URL=https://...

# Generate the Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Start the web app
pnpm --filter @lingle/web dev
```

### Authentication

Users sign in via Google OAuth through Supabase Auth. New users go through a 4-step onboarding flow (language → goals → level → first conversation). Returning users go straight to the conversation view.

## Scripts

| Command | Description |
|---|---|
| `pnpm --filter @lingle/web dev` | Start Next.js web app (localhost:3000) |
| `pnpm --filter @lingle/web build` | Production build |
| `pnpm turbo typecheck` | TypeScript check (all packages) |
| `pnpm prisma migrate dev` | Run Prisma migrations |
| `pnpm prisma studio` | Open Prisma Studio (DB browser) |
| `pnpm prisma generate` | Regenerate Prisma client |
| `pnpm prisma db seed` | Seed database with sample data |

## Architecture

### Monorepo Structure

```
lingle/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── prisma/
│   ├── schema.prisma               # 13 database models
│   ├── seed.ts
│   └── migrations/
├── apps/
│   └── web/                         # Next.js 15 app (@lingle/web)
│       ├── app/
│       │   ├── page.tsx             # Landing page (prompt-first)
│       │   ├── get-started/         # Pre-auth interstitial
│       │   ├── onboarding/          # 4-step setup wizard
│       │   ├── (auth)/              # Sign-in, OAuth callback
│       │   ├── (app)/               # Authenticated pages
│       │   │   ├── conversation/    # Text conversation view
│       │   │   │   └── voice/       # Voice session overlay
│       │   │   ├── progress/        # Session history
│       │   │   ├── upgrade/         # Pricing / Stripe checkout
│       │   │   └── ...
│       │   └── api/                 # API routes
│       │       ├── conversation/    # send, plan, end, list, xray
│       │       ├── voice/           # soniox-key, stt
│       │       ├── stripe/          # checkout, portal, webhook
│       │       ├── usage/           # Daily usage tracking
│       │       ├── subscription/    # Subscription status
│       │       ├── profile/         # Learner profile CRUD
│       │       └── tts/             # Text-to-speech
│       ├── components/
│       │   ├── voice/               # Voice session UI (15 components)
│       │   ├── chat/                # Chat input, message rendering
│       │   └── panels/              # Side panel (plan + cards)
│       ├── hooks/                   # useChat, useVoice, useSoniox, useTTS, etc.
│       └── lib/                     # Supabase, Stripe, AI tools, prompts
├── packages/
│   ├── shared/                      # TypeScript types (@lingle/shared)
│   └── db/                          # Prisma client singleton (@lingle/db)
├── docs/
│   ├── PRODUCT_VISION.md
│   ├── ARCHITECTURE_V2.md
│   ├── V2_VOICE_UPDATE.md
│   ├── GENERATIVE_ENGINE_PLAN.md
│   ├── design-system.md
│   └── progress/                    # Development logs
└── supabase/
```

### The Generative Pipeline

```
User types a prompt
      ↓
Session plan generated (Claude Haiku, ~300ms)
  ├── Conversation → scene card (character, setting, tension)
  ├── Tutor → lesson plan (steps, concepts, exercises)
  ├── Immersion → content plan (native material, comprehension)
  └── Reference → Q&A plan (topic, examples, practice)
      ↓
Plan injected into system prompt on every turn
      ↓
Claude Sonnet streams response (text + 6 tools)
  ├── suggestActions → suggestion chips
  ├── displayChoices → dialogue option buttons
  ├── showVocabularyCard → vocabulary teaching card
  ├── showGrammarNote → grammar explanation card
  ├── showCorrection → error correction card
  └── updateSessionPlan → live plan updates
      ↓
If voice mode:
  ├── Sentence boundary tracker → TTS queue → audio playback
  └── Tool outputs routed to toasts/panels instead of inline
      ↓
Plan evolves as the session progresses
```

### Voice Pipeline

```
Push-to-talk button held → Soniox realtime streaming STT
    → Endpoint detection (1500ms silence)
    → Final utterance text → Claude Sonnet (streaming)
    → SentenceBoundaryTracker (。！？ detection)
    → Each sentence → /api/tts → audio blob → sequential playback
```

5-state FSM: IDLE → LISTENING → THINKING → SPEAKING → INTERRUPTED (user talks mid-AI-response, clears queue, returns to LISTENING).

### Database Models

| Model | Purpose |
|---|---|
| `User` | Auth user (Google OAuth) |
| `LearnerProfile` | CEFR level, difficulty, goals, streaks |
| `LexicalItem` | Vocabulary with dual FSRS states, mastery tracking |
| `GrammarItem` | Grammar patterns with FSRS states |
| `ChunkItem` | Collocations and pragmatic formulas |
| `ReviewEvent` | Every SRS review |
| `ConversationSession` | Transcript, plan, targets, errors, cached analysis |
| `TomInference` | System beliefs (avoidance, confusion, regression) |
| `ItemContextLog` | Every item encounter across contexts |
| `PragmaticProfile` | Register accuracy, communication strategies |
| `CurriculumItem` | i+1 recommendations with priority scoring |
| `Subscription` | Stripe subscription (free/pro) |
| `DailyUsage` | Conversation seconds per user per day |

### Monetization

| Plan | Limit | Price |
|------|-------|-------|
| Free | 10 min/day | $0 |
| Pro | Unlimited | $8/month |

Usage is tracked per-session with live elapsed time computation. When the daily limit is hit, a blocking modal directs users to the upgrade page. Pro users manage subscriptions through Stripe's billing portal.

## Environment Variables

### Web app `apps/web/.env.local`
```
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...

# Voice
SONIOX_API_KEY=...
OPENAI_API_KEY=...              # For TTS and fallback STT

# Payment
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_APP_URL=https://...
```

## Progress

See [docs/progress/](docs/progress/) for detailed development logs.

## Documentation

| Document | Description |
|----------|-------------|
| [PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | Product direction and roadmap |
| [ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md) | Technical architecture (session plans, voice, tools) |
| [V2_VOICE_UPDATE.md](docs/V2_VOICE_UPDATE.md) | Voice pipeline deep dive |
| [GENERATIVE_ENGINE_PLAN.md](docs/GENERATIVE_ENGINE_PLAN.md) | Conversation engine technical plan |
| [design-system.md](docs/design-system.md) | UI design system reference |
