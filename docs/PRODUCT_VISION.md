# Lingle — Product Vision

## The One-Line Pitch

Lingle is a generative language immersion engine. You describe where you want to be, and it takes you there.

---

## What We're Building

Most language apps make you feel like you're studying. Lingle makes you feel like you're living.

Type "I'm at a ramen shop in Osaka" and you're standing at the counter. A cook greets you. The menu is on the wall. You have to order — in Japanese, at your level, with just enough support to stretch without breaking. Type "let's just talk" and you have a warm, curious conversation partner who notices your mistakes without stopping you. Type "teach me keigo" and you get a patient tutor who meets you exactly where you are.

One app. One prompt. Infinite formats.

The core experience: after a 15-minute session, the learner should feel like they just had a real interaction in their target language. Not a quiz. Not a lesson. An experience they'd actually tell someone about.

---

## The Feeling

**Teleported, not tutored.** The learner forgets they're using an app. They're in the scene, making choices, reacting to characters, improvising responses. The language is the vehicle, not the destination.

**Met where they are.** A beginner sees furigana on every kanji, English hints woven into narration, and simple choices. An advanced learner sees raw Japanese with dialect, slang, and register shifts. Same app, same scenario — completely different experience. The difficulty is invisible.

**Gently stretched.** The AI speaks at the learner's level + 10%. Not so easy it's boring. Not so hard it's paralyzing. The 70-85% comprehension sweet spot where acquisition happens naturally — Krashen's i+1, but felt rather than calculated.

**Never punished.** When you make a mistake, the AI recasts it naturally. "I went to store" becomes "Oh, you went to the store? Which one?" in the AI's next line. An italic aside appears only when the error is instructive. You're never stopped. You're never told "that's wrong." You learn by hearing it right.

**Surprised.** The cook at the ramen shop has a personality. She's from Hokkaido and has opinions about your order. The ghost story takes a turn you didn't expect. The tutoring session uses an example that makes you laugh. Language learning is a daily habit — the app has to earn every return visit.

---

## Core Design Principle: Generative Flexibility

There is no single "mode." The AI reads the learner's intent and adapts:

| What the learner says | What happens |
|---|---|
| "Let's just chat in Japanese" | Casual conversation partner — warm, curious, responsive |
| "I'm at a ramen shop in Osaka" | Narrated immersion with characters, setting, branching choices |
| "Teach me how to use te-form" | Guided tutoring with examples, practice, corrections |
| "I want to practice keigo for a job interview" | Targeted scenario with specific register focus |
| "Tell me a ghost story in Japanese" | Creative/narrative mode — engaging AND educational |
| "Help me read this NHK article" | Reading comprehension guide with glossing and grammar notes |

The AI doesn't announce which mode it's in. It just does it. And it shifts fluidly mid-session: a casual chat becomes a mini-lesson when the learner asks "wait, why did you use that grammar?", and a structured scenario loosens into free conversation when the learner goes off-script.

**This flexibility IS the product.** Most language apps force you into one format. Lingle meets you where you are.

---

## What Exists Today

### Conversation Engine
- **AI partner** powered by Claude Sonnet 4, with a rich meta-prompt that adapts to any situation
- **23 curated scenarios** across 8 categories: casual conversation, real-world situations (ramen shop, train station, convenience store), work & formal, social, structured learning, culture, and creative
- **Free prompt input** — type anything and the AI builds the right experience around it
- **Streaming responses** with real-time rendering as the AI generates
- **Contextual suggestions** — after each response, the AI proposes 2-3 natural next actions the learner could take ("Sit at the counter", "Ask about the specials", "Order in casual Japanese")
- **Branching choices** — the AI can offer numbered dialogue options with Japanese text and English hints
- **Session persistence** — every conversation is transcribed and stored for future analysis

### Difficulty System
Six calibrated levels that control everything the AI does:

| Level | Label | What it means |
|---|---|---|
| 1 | Beginner (N5) | Hiragana/katakana primary, English translations for all dialogue, annotate all kanji |
| 2 | Elementary (N4) | Basic kanji with furigana, polite form, English hints for key phrases |
| 3 | Intermediate (N3) | Mixed Japanese/English narration, casual + polite, furigana for N3+ kanji |
| 4 | Upper-Intermediate (N2) | Mostly Japanese, natural contractions, dialect hints |
| 5 | Advanced (N1) | Full natural Japanese, furigana only for rare kanji, full register variation |
| 6 | Near-Native | Unrestricted complexity, no furigana, literary narration |

The learner picks their level in settings. It changes every interaction without them having to think about it again.

### Japanese Input
A full Japanese IME (Input Method Editor) built into the chat:
- Type romaji, see it convert to kana in real-time
- Space bar brings up kanji candidates with intelligent segmentation
- Hiragana/katakana toggle
- Composition highlighting that feels native

### Reading Support
- **Furigana** — the AI annotates kanji above the learner's level with `{kanji|reading}` syntax, rendered as proper ruby annotations
- **Romaji toggle** — for absolute beginners, overlay romaji on all Japanese text
- **Styled character dialogue** — NPC speech in scenes renders as visually distinct blockquotes with character names
- **Cultural notes** — italic asides render with subtle visual treatment so they're distinct from narration

### Voice
- **Text-to-speech** on every AI message — hear how it sounds with natural Japanese pronunciation
- Play/stop controls on each message with 24-hour caching for efficiency

### AI Tools
The conversation partner has structured tools it can call mid-conversation:
- **Suggest actions** — contextual next moves for the learner
- **Display choices** — branching dialogue with hints
- **Show vocabulary cards** — word, reading, meaning, example sentence, notes
- **Show grammar notes** — pattern, formation, examples, JLPT level
- **Show corrections** — original vs. corrected with explanation

### Infrastructure
- **Auth** — Google OAuth via Supabase
- **Database** — PostgreSQL with Prisma ORM, full schema for users, profiles, sessions, vocabulary, grammar, review events, and knowledge model tables
- **Monorepo** — pnpm workspaces with shared types and DB packages
- **Stack** — Next.js 15, React 19, TypeScript, Tailwind CSS, Vercel AI SDK

---

## What Makes This Different

**1. Truly generative.** Every other language app is a content library with a fixed format. Duolingo has lessons. Italki has tutors. ChatGPT has... a chat box. Lingle generates the entire experience from a single prompt. The same app handles casual conversation, immersive roleplay, structured grammar drills, creative storytelling, and reading comprehension. No mode switching. No menus. Just describe what you want.

**2. Fluid mode-switching.** A casual chat becomes a mini-lesson when you ask "why did you say that?" A structured scenario loosens into free conversation when you go off-script. The AI follows your energy, not a script. This is how real language immersion works — you don't switch between "conversation mode" and "learning mode" in real life.

**3. Invisible difficulty.** No "N3 mode" label. No "select your level" before every session. You set it once, and everything calibrates: vocabulary ceiling, grammar complexity, kanji density, English support, ruby annotations, register. The learner doesn't think about difficulty. They just talk.

**4. Corrections that don't break flow.** In real immersion, nobody stops you mid-sentence to correct your grammar. A good conversation partner uses the right form in their response, and you absorb it. Lingle does the same — errors are recast naturally with brief italic asides only when instructive. The conversation never stops for a grammar lecture.

**5. Immersive on demand.** Scenes have characters with personality, atmosphere, branching choices. The ramen shop cook has opinions. The train station attendant is patient. But immersion is only one mode — simple conversation is equally first-class. The product is not "an immersive scenario app." It's whatever you need it to be.

**6. One prompt, instant start.** No onboarding wizard. No level selection per scenario. No loading screen while the AI "plans your lesson." Type or tap, and you're in. Session startup is instant because the meta-prompt handles everything.

---

## The Knowledge Model (In Progress)

The database schema exists for a comprehensive learner knowledge model. The tables are in place but the algorithms to populate and leverage them are the next major engineering effort.

### What the schema supports

- **Lexical items** — every vocabulary word the learner has encountered, with separate FSRS (spaced repetition) states for recognition and production
- **Grammar items** — every grammar pattern, with mastery tracking from "unseen" through "burned"
- **Chunk items** — collocations, pragmatic formulas, and fixed phrases
- **Review events** — every SRS interaction graded (again / hard / good / easy) with modality tracking
- **Theory of Mind inferences** — detected patterns like avoidance (the learner never uses te-form in conversation despite drilling it), confusion pairs (mixing up similar words), and regressions (previously mastered items degrading)
- **Item context logs** — where and how each item was encountered across conversations
- **Pragmatic profile** — register accuracy, hesitation patterns, speaking pace
- **Curriculum queue** — prioritized items for upcoming sessions

### The vision

The learner profile is the product. Everything reads from it; everything writes to it. Every conversation updates the model. Every session plan draws from it.

A learner who uses Lingle daily for 30 days has a demonstrably more accurate, personalized knowledge model than on day 1. The conversation agent's session plans visibly improve over time. Items the learner avoids get gently targeted. Confusion pairs get disambiguation exercises. Regressions trigger review. The app knows where you are — really knows — and uses that to decide what you should encounter next.

The mastery state machine gates progression on evidence, not time:

| State | What it means |
|---|---|
| Unseen | Never encountered |
| Introduced | Seen in conversation or curriculum |
| Apprentice 1-4 | In active SRS review, recognition confirmed |
| Journeyman | **Production evidence required** — used correctly in conversation or drill |
| Expert | Consistent across modalities |
| Master | Stable long-term |
| Burned | Recalled after 4+ month gap, removed from rotation |

The critical gate: items cannot advance past Apprentice 4 without a logged production event. The system must create contexts — conversation targets or production drills — to generate that evidence.

---

## Near-Term Roadmap

### SRS Review Engine
Fast, clean, locally-computed spaced repetition using FSRS (Free Spaced Repetition Scheduler). Recognition, production, and cloze modalities. The daily anchor habit that complements conversation sessions. The review queue is computed on demand from the knowledge model — no network dependency.

### Word Bank
A browsable, searchable ledger of every item in the learner's vocabulary. Filter by mastery state, tags, source. Per-item detail shows FSRS state (retrievability, stability, difficulty), encounter history, and production count. The learner can see exactly what they know and what's shaky.

### Post-Session Analysis
After each conversation ends, a second AI call analyzes the transcript: which target vocabulary was successfully produced? What errors were made? What items did the learner avoid? What new items were encountered? This feeds back into the knowledge model and informs the next session plan.

### Pre-Session Planning
Before a conversation starts, the system reads the learner's profile and generates a session plan: 3-5 vocabulary targets from the apprentice/journeyman tier, 1-2 grammar patterns flagged as avoidance or confusion, a recommended difficulty level, and a session focus. The AI partner receives this plan and engineers natural conversational moments to elicit the targets.

### Theory of Mind Engine
Scheduled inference runs that read the database and detect patterns:
- **Avoidance** — item has been in journeyman for 3+ sessions with zero conversation production
- **Confusion pairs** — two items flagged with errors in the same sessions repeatedly
- **Regression** — master/expert items graded "again" or "hard" recently
- **Daily brief** — a structured JSON summary injected into the session planning prompt

---

## Future Product Directions

### Voice Conversations

**Pipeline:** STT (speech-to-text) → LLM → TTS (text-to-speech)

The user speaks into the mic. Their speech is transcribed, fed to the same LLM pipeline, and the AI's response is spoken aloud with native-quality pronunciation. LLM tokens stream into TTS as they arrive — target: under 1 second to first audio.

Why modular, not end-to-end: we need the text transcript for corrections, vocabulary logging, and the knowledge model. An end-to-end speech model hides the text layer. The modular pipeline preserves everything the text-based architecture already does while adding voice as an I/O layer.

Voice adds new signal to the knowledge model:
- Pronunciation accuracy (comparing STT transcript against intended utterance)
- Hesitation events (long pauses mid-utterance as fluency indicators)
- L1 intrusion (English detected mid-Japanese utterance)
- Speaking pace (words-per-minute tracked per session, trended over time)

The existing architecture supports this cleanly — the `PartRenderer` already handles different part types, and audio parts would slot in naturally.

### Generated Visuals

When the AI describes a scene, it could also generate an image of it — the ramen shop interior, the Kyoto street, the office meeting room. This transforms immersion from imagination to visual.

The AI calls a `generateScene` tool when the setting changes significantly. The tool triggers image generation server-side, and the result renders inline in the message stream. The tool-based architecture makes this a natural extension — each new modality is just a new tool.

### Interactive Exercises

The AI generates interactive elements mid-conversation: fill-in-the-blank exercises, drag-and-drop word ordering, visual quizzes, kanji stroke-order practice. These render as custom React components driven by structured tool output.

Tools like `interactiveExercise({ type: 'fill-in-blank', sentence: '...', blank: '...' })` return JSON that maps to pre-built components. The same rendering pipeline handles them — each tool type maps to a component. The AI decides when to use them based on what the learner needs.

### Reading Assist

Surface real Japanese content — NHK articles, manga panels, song lyrics, social media posts — and guide the learner through it. Gloss vocabulary, explain grammar patterns, check comprehension. The AI acts as a reading companion rather than a teacher, helping the learner engage with authentic material at their level.

### Multi-Language Support

V1 is Japanese-only. The architecture is language-agnostic: the difficulty levels, meta-prompt, scenario system, and knowledge model all parameterize on target and native language. Expanding to Korean, Mandarin, Spanish, and other languages requires new difficulty level definitions, language-specific input methods, and curated scenarios — but no architectural changes.

### Ambient Learning

The knowledge model runs in the background even when the learner isn't actively in a session. It detects items due for review, schedules nudges, and surfaces "daily moments" — tiny interactions (a word of the day, a quick context sentence, a mini-quiz) that keep the learner's exposure consistent without requiring a full session.

---

## Success Metrics

### Engagement
- **Session frequency** — learners return at least 4 days/week
- **Session duration** — average session is 10-20 minutes (long enough to be meaningful, short enough to be sustainable)
- **Session variety** — learners use multiple scenario types, not just one format
- **Free prompt usage** — learners create their own scenarios, not just pick from curated ones

### Learning
- **Knowledge model richness** — after 30 days, the learner's profile contains 200+ lexical items with accurate mastery states
- **Production evidence** — the conversation agent successfully elicits target vocabulary in natural contexts
- **Post-session accuracy** — analysis correctly identifies 80%+ of target vocabulary hits and errors
- **Mastery progression** — items move through the state machine at expected rates, with production gating working as designed

### Experience
- **"I had a real conversation"** — the core qualitative measure. After a session, the learner feels like they practiced the language, not like they used an app
- **Difficulty calibration** — the learner doesn't feel lost (too hard) or bored (too easy). The 70-85% comprehension target should be felt intuitively
- **Error correction acceptance** — learners absorb recasts without feeling corrected. No frustration signal from corrections

### Technical
- **Time to first token** — under 1 second from send to first streamed response
- **Session startup** — instant (no planning LLM call, no loading screen)
- **IME responsiveness** — kana conversion and kanji candidate display feel native

---

## Target User

**The motivated self-studier who wants to use their Japanese, not just study it.**

They've done the textbook thing. They know some grammar, recognize some kanji, can read simple sentences. But they don't have access to immersive environments. They might live in a country where Japanese isn't spoken. They might be too anxious to practice with real people. They might just want a low-pressure space to try things out.

They don't want flashcards (though they'll use SRS if it's seamless). They don't want grammar drills (though they'll welcome a grammar explanation when they're confused). They want to feel what it's like to actually use the language — to order food, to chat with someone, to read a sign, to tell a story.

They are:
- Intermediate learners (N4-N3) who have grammar knowledge but lack production confidence
- Self-studiers who supplement textbooks with immersive practice
- Busy professionals who want 15-minute daily sessions that feel meaningful
- Language enthusiasts who are drawn to the cultural experience, not just the mechanics
- People who've tried conversation apps and found them either too rigid or too unstructured

Lingle is for anyone who wants language learning to feel less like homework and more like travel.

---

## Design Philosophy

**The learner profile is the product.** Everything reads from it. Everything writes to it. The conversation, the SRS, the session planning, the difficulty calibration — all driven by a living map of what the learner knows.

**Meet people where they are.** If they want to chat, chat. If they want a scene, build one. If they want a grammar lesson, teach. If they speak English, gently redirect but never punish. The app adapts to the learner, not the other way around.

**Earn every return visit.** Language learning is a years-long commitment. The app has to be a place people want to come back to. That means personality, surprise, variety, and the feeling of progress. Not just effectiveness — delight.

**Simple surface, deep engine.** The UI is a text box and a grid of scenarios. That's it. Behind it: a meta-prompt system, difficulty engine, knowledge model, spaced repetition scheduler, theory of mind inference, and multi-tool AI partner. The complexity serves the learner without burdening them.

**Corrections through compassion.** The hardest part of language learning isn't grammar — it's the courage to try. Every design decision protects that courage. Recasting over correction. Encouragement over judgment. Progress over perfection.
