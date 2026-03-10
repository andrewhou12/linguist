# Branch Diff: `testingvoicemode` vs `main`

> Generated 2026-03-10 | 109 files changed | +12,908 / -4,009 lines

This document describes the architectural changes, new systems, and vision shifts introduced in the `testingvoicemode` branch relative to `main`.

---

## Table of Contents

1. [Summary](#summary)
2. [Multi-Language Support](#multi-language-support)
3. [Voice Pipeline Architecture](#voice-pipeline-architecture)
4. [Voice Session State Machine](#voice-session-state-machine)
5. [Binary Stream Protocol](#binary-stream-protocol)
6. [Learner Signal Analysis](#learner-signal-analysis)
7. [Session Planning Overhaul](#session-planning-overhaul)
8. [Conversation System Prompt Redesign](#conversation-system-prompt-redesign)
9. [New API Routes](#new-api-routes)
10. [UI/UX Overhaul](#uiux-overhaul)
11. [Onboarding System](#onboarding-system)
12. [Landing Page Redesign](#landing-page-redesign)
13. [Schema & Dependencies](#schema--dependencies)
14. [Architectural Principles](#architectural-principles)

---

## Summary

The `testingvoicemode` branch represents a leap from a Japanese-only text chat prototype to a **multi-language voice-first learning platform**. The major shifts are:

- **8 languages supported** (Japanese, Korean, Mandarin, Spanish, French, German, Italian, Portuguese) with per-language configuration for STT, TTS, proficiency frameworks, and difficulty scaffolds.
- **Full voice pipeline** with three TTS providers (Cartesia, Rime, ElevenLabs), Soniox STT, and an optional Hume EVI integration — all behind pluggable abstractions.
- **Server-side audio streaming** via a custom binary frame protocol that eliminates browser-to-server round-trips per sentence.
- **Structured session plans** (conversation scripts, tutor lesson steps) tracked in real-time with progress visualization.
- **Turn-by-turn analysis** running asynchronously during voice sessions, surfacing corrections, vocabulary, and grammar notes without interrupting conversational flow.
- **A pure-TypeScript voice session FSM** with zero framework dependencies, managing push-to-talk, interrupts, muting, and state transitions.

---

## Multi-Language Support

### Before (main)
Japanese-only. UI strings, content templates, difficulty levels, and proficiency framework (JLPT) were all hardcoded.

### After (testingvoicemode)

**New files:**
- `lib/languages.ts` — Central language registry with per-language metadata
- `lib/language-difficulty-configs.ts` — Language-specific difficulty scaffolds

Each language entry includes:
| Field | Example (Japanese) |
|-------|-------------------|
| STT codes | `soniox: "ja"`, `whisper: "ja"` |
| TTS language codes | `cartesia: "ja"`, `elevenlabs: "ja"` |
| Proficiency framework | JLPT (N5–N1) |
| Script detection regex | CJK Unicode ranges |
| Greeting templates | Time-aware, native-language greetings |
| Font classes | CJK-specific font stacks |
| Sentence boundary chars | `。！？` |
| Filler words | `えっと, あの, まあ` |

**Supported languages:** Japanese, Korean, Mandarin Chinese, Spanish, French, German, Italian, Portuguese.

**Difficulty levels** (`difficulty-levels.ts`) are now language-aware. `getDifficultyLevel(level, targetLanguage)` merges universal scaffolds (levels 1–6) with language-specific grammar/script guidance from `language-difficulty-configs.ts`.

**Prisma schema change:** `ConversationSession.targetLanguage` no longer defaults to `"Japanese"` — it must be explicitly set per session.

---

## Voice Pipeline Architecture

### Before (main)
Basic TTS integration. No server-side audio streaming. No STT enrichment.

### After (testingvoicemode)

```
Microphone → Soniox STT (WebSocket) → Enriched transcript
                                            ↓
                               Turn signal analysis (hesitation, filler, L1 intrusion)
                                            ↓
                              /api/conversation/voice-stream
                                    ↓              ↓
                              Claude LLM      Cartesia TTS
                                    ↓              ↓
                              Binary frame protocol (text + PCM audio)
                                            ↓
                              PCMStreamPlayer (Web Audio API)
                                            ↓
                              Speaker output + live subtitles
```

### TTS Providers (3 supported, cascading fallback)

| Provider | Role | Format | Latency |
|----------|------|--------|---------|
| **Cartesia Sonic** | Primary | 24kHz PCM Int16LE | Sub-100ms TTFB |
| **Rime** | Fallback (CJK) | WebSocket-based | ~150ms |
| **ElevenLabs** | Final fallback | 24kHz PCM | ~200ms |

**New files:**
- `lib/cartesia-sse.ts` — Parses Cartesia's SSE stream into PCM chunks, handles base64 decoding
- `lib/rime-ws.ts` — Persistent WebSocket connection to Rime API with queue-based request handling
- `lib/voice/pcm-stream-player.ts` — Browser-based PCM audio playback via Web Audio API (AudioContext + ScriptProcessorNode), with interrupt and speed control
- `lib/voice/voice-provider-config.ts` — Provider enum (`CARTESIA | RIME | ELEVENLABS | HUME`)

### Hume EVI (Alternative Full-Stack Provider)

An optional alternative voice path using Hume's Empathic Voice Interface:
- `hooks/use-hume-voice.ts` — Wraps `@humeai/voice-react`, exposes the same `UseVoiceConversationReturn` interface as the primary pipeline
- `api/voice/hume-clm/route.ts` — Custom language model bridge so Hume uses Claude as its LLM
- `api/voice/hume-token/route.ts` — Token generation for Hume authentication

The Hume path provides the same UI contract as the Cartesia/Soniox pipeline, making the two providers swappable at the hook level.

---

## Voice Session State Machine

### Before (main)
Simple reducer with basic state transitions managed inside React components.

### After (testingvoicemode)

**New file:** `lib/voice/voice-session-fsm.ts`

A **pure TypeScript FSM** with zero React/Electron dependencies:

```
States: IDLE → LISTENING → THINKING → SPEAKING → INTERRUPTED
```

Capabilities:
- **Push-to-talk:** `startTalking()` / `stopTalking()` / `cancelTalking()`
- **Auto-endpoint mode:** Automatic speech boundary detection via Soniox
- **Interrupt handling:** User can cut off AI mid-sentence, immediately transitioning to LISTENING
- **Turn counter + analysis dispatch:** Fires `/api/conversation/voice-analyze` after each exchange
- **Mute toggles:** `toggleMute()` pauses/resumes STT without ending session
- **Session lifecycle:** `startSession()` / `endSession()`

All state changes trigger registered callbacks, enabling UI reactivity without React re-renders. The FSM is trivially testable — it takes data in and returns state out, with no side effects beyond callback invocation.

---

## Binary Stream Protocol

### New file: `lib/voice/voice-stream-protocol.ts`

A custom binary frame protocol for the server→client voice stream. This is the key latency optimization: LLM text and TTS audio are interleaved in a single HTTP response stream, eliminating per-sentence round-trips.

**Frame types:**

| Type | ID | Payload | Purpose |
|------|----|---------|---------|
| `TEXT_DELTA` | `0x01` | UTF-8 string | LLM text chunk for live subtitles |
| `AUDIO` | `0x02` | Int16LE PCM | Raw audio chunk (24kHz) |
| `SENTENCE_START` | `0x03` | UTF-8 string | Marks beginning of a TTS sentence |
| `SENTENCE_END` | `0x04` | Empty | Marks end of audio for a sentence |
| `DONE` | `0x05` | Empty | Stream complete |
| `ERROR` | `0x06` | UTF-8 string | Error message |

**Header format:** `[type: uint8][length: uint32 BE][payload]`

The parser (`parseVoiceStream`) handles frame reassembly across network chunk boundaries, which is critical for reliable binary streaming over HTTP.

**Supporting module:** `lib/voice/sentence-boundary.ts` — Tracks sentence progress during TTS output using per-language sentence-end characters (。！？ for CJK, .!? for Latin scripts).

---

## Learner Signal Analysis

### New file: `lib/voice/turn-signals.ts`

After each STT utterance, the system performs signal analysis to detect:

| Signal | Detection Method | Use |
|--------|-----------------|-----|
| **Hesitation gaps** | Silences > 500ms between tokens | Difficulty indicator |
| **Filler words** | Per-language filler dictionary (`lib/voice/filler-words.ts`) | Fluency metric |
| **Low-confidence tokens** | STT confidence < 0.6 | Pronunciation issues |
| **Trailing off** | Silence > 2000ms at end | Uncertainty signal |
| **Self-corrections** | Token-level analysis | Learning behavior |
| **Speaking pace** | Words-per-minute calculation | Fluency tracking |
| **L1 intrusion** | English words mixed into target language | Code-switching detection |

These signals are formatted via `formatSignalsForLLM()` and injected into the Claude prompt so it can adapt in real-time — simplifying when the learner hesitates, gently redirecting when they switch to L1.

**Filler word coverage** (`lib/voice/filler-words.ts`): All 8 supported languages have curated filler and reaction word lists (e.g., Japanese: えっと, あの, まあ; Korean: 음, 어, 그; French: euh, ben, bon, enfin, quoi, du coup).

---

## Session Planning Overhaul

### Before (main)
Session plans were loose JSON blobs stored on the conversation session record.

### After (testingvoicemode)

**New files:**
- `lib/session-types.ts` — TypeScript types for structured session plans
- `lib/session-plan.ts` — Normalization, formatting, and backward-compat migration

**Plan types** (discriminated union):

1. **ConversationPlan** — Natural conversation with a persona
   - Topic, persona (name, relationship, personality), register, tone, setting
   - **Sections:** Ordered skeleton (greeting → topic-1 → topic-2 → closing) with per-section status tracking (`upcoming | active | completed`)

2. **TutorPlan** — Structured lesson
   - Objective, topic, concepts (tagged vocabulary/grammar/usage)
   - **Lesson steps:** `[type: activate|explain|check|practice|produce|review]` with status tracking
   - Exercise types for each step

3. **ImmersionPlan** / **ReferencePlan** — Additional plan shapes for other session modes

**Key features:**
- `normalizePlan()` migrates old-shape JSON from `main` to the new structures
- `formatPlanForPrompt()` renders plans as readable prompt blocks with status icons, injected into the Claude system prompt
- Session plan sidebar (`session-plan-sidebar.tsx`) shows real-time progress through sections/steps

---

## Conversation System Prompt Redesign

### New file: `lib/conversation-prompt.ts`

The conversation partner's system prompt is now built dynamically via `buildVoiceSystemPrompt()`:

**Universal difficulty scaffolds** (Levels 1–6): Each level specifies vocabulary ceiling, grammar scope, English support level, and output complexity.

**Language-specific inserts** merged per-level: e.g., for Japanese Level 2, the prompt includes kanji annotation rules and particle guidance; for Korean Level 3, it includes honorific level expectations.

**Voice-specific behavioral rules** (when `voiceMode: true`):
- **Brevity:** 2–3 sentences max (spoken output can't be monologues)
- **Naturalness:** Use filler words, trailing off, varied sentence lengths
- **TTS formatting:** Clean sentence boundaries (。！？), no markdown/lists/bullets
- **Language switching:** If learner switches to English, respond briefly then redirect
- **First message:** Must be a warm greeting in character
- **Learner signal adaptation:** Simplify on hesitation, handle L1 switching gracefully

**Session plan injection:** The current plan (with section/step statuses) is formatted and included so Claude knows what's been covered and what to steer toward next.

---

## New API Routes

| Route | Lines | Purpose |
|-------|-------|---------|
| `/api/conversation/voice-stream` | 367 | Server-side LLM + Cartesia TTS streamed as binary frames |
| `/api/conversation/voice-analyze` | 120 | Per-turn analysis: corrections, vocab cards, grammar notes, naturalness score |
| `/api/conversation/help` | 31 | In-session help sub-chat (learner can ask questions without leaving voice) |
| `/api/conversation/lookup` | 46 | Word/phrase lookup returning meaning, examples, and usage notes |
| `/api/conversation/translate` | 25 | Quick translation of learner input |
| `/api/tts/stream` | 153 | Unified TTS streaming with Cartesia/Rime/ElevenLabs fallback |
| `/api/tts/interrupt` | 16 | Cancel in-progress TTS playback |
| `/api/voice/hume-clm` | 184 | Hume custom language model bridge (routes to Claude) |
| `/api/voice/hume-token` | 30 | Hume authentication token generation |

**Modified routes:**
- `/api/conversation/send` — Now caches session data, supports voice mode flag, uses Haiku for voice (speed) and Sonnet for chat (depth), added prompt cache breakpoints
- `/api/conversation/end` — Expanded post-session analysis
- `/api/conversation/plan` — Generates structured `ConversationPlan` / `TutorPlan` objects

---

## UI/UX Overhaul

### New Session Components (`components/session/`)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `begin-overlay.tsx` | 435 | Pre-session: plan review + context steering input |
| `session-nav-bar.tsx` | 139 | Top nav: timer, language indicator, controls |
| `session-plan-sidebar.tsx` | 389 | Real-time section/step progress tracking |
| `prompt-screen.tsx` | 609 | Initial prompt display + response generation |
| `loading-screen.tsx` | 127 | Session initialization spinner |
| `session-debrief.tsx` | 255 | Post-session summary: accuracy, time, new items |
| `end-confirmation.tsx` | 81 | End-session confirmation dialog |

### New Voice Components (`components/voice/`)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `voice-live-subtitles.tsx` | 304 | Scrolling transcript of user + AI with timestamps |
| `voice-corrections-panel.tsx` | 145 | Grammar/vocabulary corrections from turn analysis |
| `voice-help-panel.tsx` | 141 | In-session help chat panel |
| `voice-lookup-panel.tsx` | 109 | Word lookup with meaning + examples |
| `voice-turn-grade.tsx` | 168 | Post-turn self-grading (Good / Hard / Again) |
| `voice-state-ring.tsx` | 112 | Visual FSM state indicator (IDLE → LISTENING → THINKING → SPEAKING) |
| `voice-corner-panel.tsx` | 67 | Toggleable panel for help/lookup/corrections |
| `chat-session-overlay.tsx` | 880 | Text chat session wrapper (redesigned) |
| `ui-message-renderer.tsx` | 243 | Unified message rendering for chat bubbles |

### Significantly Redesigned Components

- **`voice-session-overlay.tsx`** — Rewritten from ~400 to ~793 lines. Now manages the full voice session lifecycle, FSM integration, panel states, and live subtitles.
- **`voice-central-orb.tsx`** — Redesigned animation states tied to FSM (idle pulse, listening glow, thinking shimmer, speaking wave).
- **`voice-controls.tsx`** — Added spacebar push-to-talk, mute toggle, playback speed, panel toggle buttons.
- **`conversation-view.tsx`** — Gutted from ~1400 to ~400 lines. Most logic extracted into session components and the chat-session-overlay.

---

## Onboarding System

### New files:
- `hooks/use-onboarding.ts` — Coach mark + hint system
- `components/onboarding/coach-mark.tsx` — Tooltip-style overlay hints
- `components/onboarding/welcome-card.tsx` — First-time user welcome

**Hint IDs tracked:** `welcome_card`, `hint_suggestions`, `hint_voice_toggle`, `hint_voice_spacebar`, `hint_voice_feedback`, and more.

Uses `localStorage` + pub/sub pattern for cross-component state without React context overhead.

---

## Landing Page Redesign

`app/page.tsx` received a major overhaul:

- **Language pill selector** — 8 language flags, click to select target language
- **Per-language prompt chips** — Contextual conversation starters change by language
- **Greeting marquee** — Animated scroll of greetings in all 8 languages
- **Multilingual character grid** — Showcases scripts from all supported languages
- **Difficulty preview cards** — Language-agnostic level descriptions
- **Default state** — Works with no language selected (general landing) or per-language content

`app/page.japanese.tsx` is an experimental Japanese-only variant of the landing page.

---

## Schema & Dependencies

### Prisma Schema
- `ConversationSession.targetLanguage` — Removed `@default("Japanese")`. Now required per session.

### New Dependencies
```json
{
  "@humeai/voice-react": "^0.2.14",
  "hume": "^0.15.15",
  "ws": "^8.19.0"
}
```

### New Environment Variables (`.env.example`)
```
CARTESIA_API_KEY=sk_car_...
CARTESIA_VOICE_JA=...   # Per-language voice IDs
CARTESIA_VOICE_EN=...
CARTESIA_VOICE_KO=...
CARTESIA_VOICE_ZH=...
CARTESIA_VOICE_ES=...
CARTESIA_VOICE_FR=...
CARTESIA_VOICE_DE=...
CARTESIA_VOICE_IT=...
CARTESIA_VOICE_PT=...
SONIOX_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

---

## Architectural Principles

Several design principles emerged in this branch that represent a deliberate architectural direction:

### 1. Provider Abstraction
Voice providers (Soniox STT, Cartesia/Rime/ElevenLabs TTS, Hume EVI) are all pluggable behind common interfaces. The `use-hume-voice.ts` and `use-voice-conversation.ts` hooks expose the same `UseVoiceConversationReturn` type, making provider swaps invisible to the UI layer.

### 2. Framework-Free Core Logic
The `VoiceSessionFSM`, turn signal analysis, sentence boundary detection, and stream protocol are all pure TypeScript with zero React or framework dependencies. They're testable in isolation and portable to other runtimes.

### 3. Server-Side Audio Optimization
The `/voice-stream` endpoint generates both LLM text and TTS audio server-side, streaming them in interleaved binary frames. This eliminates the browser→server latency tax per sentence that a client-side TTS approach would incur — critical for hitting the <1s time-to-first-audio target.

### 4. Multi-Language as First-Class
Language is not a string flag — it's a rich configuration object that shapes STT codes, TTS voices, proficiency frameworks, difficulty scaffolds, filler word dictionaries, script detection, sentence boundaries, and system prompts. Adding a new language means adding one config entry, not touching dozens of files.

### 5. Real-Time Analysis Without Blocking Flow
Turn-by-turn analysis (`/voice-analyze`) runs asynchronously after each exchange. Corrections, vocabulary cards, and grammar notes are surfaced in side panels without interrupting the conversation. The learner can review them when ready, not when the system demands attention.

### 6. Session Plan as Living Object
Plans are no longer static JSON blobs — they're typed objects with per-section/per-step status tracking (`upcoming | active | completed`). The sidebar shows real-time progress. The system prompt includes current plan state so Claude knows what's been covered and what to steer toward.

### 7. Adaptive Difficulty via Learner Signals
STT confidence scores, hesitation patterns, filler word frequency, speaking pace, and L1 intrusion events are all captured, analyzed, and injected into the LLM prompt. The conversation partner adapts in real-time rather than relying solely on the static learner profile.
