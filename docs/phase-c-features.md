# Phase C Deferred Features — Implementation Record

## Feature 1: Naturalness Score

**New tool** `rateNaturalness` — Claude calls it after each user message containing Japanese to rate naturalness.

### Files modified
- `apps/web/lib/conversation-tools.ts` — Added `rateNaturalnessSchema` and `rateNaturalness` tool (no-op execute, returns `{ rating, note }`)
- `packages/core/src/conversation/planner.ts` — Added rule 19 to system prompt: call `rateNaturalness` for every user message with Japanese
- `apps/web/app/(app)/conversation/page.tsx` — `naturalnessMap` memo extracts tool output from assistant messages, keyed by preceding user message ID. Passed as `naturalness` prop to `UIMessageRenderer`, rendered as `NaturalnessBadge` child of user's `MessageBlock`

### New file
- `apps/web/components/chat/naturalness-badge.tsx` — Pill badge: green "Natural" (`bg-green-soft text-green`), blue "Good" (`bg-blue-soft text-blue`), warm "Needs work" (`bg-warm-soft text-accent-warm`) + optional note text

---

## Feature 2: Dynamic Suggestion Chips

**New tool** `suggestResponses` — Claude calls it at the end of every response with 2-3 contextual suggestions.

### Files modified
- `apps/web/lib/conversation-tools.ts` — Added `suggestResponsesSchema` and `suggestResponses` tool (no-op execute, returns `{ suggestions }`)
- `packages/core/src/conversation/planner.ts` — Added rule 20: call `suggestResponses` at end of every response with 2-3 target-language suggestions
- `apps/web/app/(app)/conversation/page.tsx` — `dynamicSuggestions` memo extracts from latest assistant message's `tool-suggestResponses` part. Passed to existing `SuggestionChips` component; `DEFAULT_SUGGESTIONS` used as fallback

### No new files
Existing `SuggestionChips` component already accepts `suggestions: string[]` prop.

---

## Feature 3: Sentence X-Ray

On-demand AI-powered word-by-word sentence breakdown. User clicks "X-Ray" button on any assistant message.

### New files
- `apps/web/app/api/conversation/xray/route.ts` — POST route accepting `{ sentence }`. Sends to Claude Haiku (`claude-haiku-4-5-20251001`) for breakdown. Returns `{ tokens: Array<{ surface, reading, romaji, pos, meaning }> }`. Uses `withAuth` wrapper.
- `apps/web/components/chat/sentence-xray.tsx` — `SentenceXRayButton`: click triggers API call, toggles expandable panel showing tokens in flex-wrap layout (romaji above, surface form, POS badge color-coded, meaning below). Caches result after first load.

### Files modified
- `apps/web/lib/api.ts` — Added `conversationXray(sentence)` method
- `apps/web/app/(app)/conversation/page.tsx` — X-Ray button rendered after assistant message parts. Only shown when not streaming.

### POS color map
- noun: `bg-blue-soft text-blue`
- verb: `bg-green-soft text-green`
- adj: `bg-purple-soft text-purple`
- particle: `bg-bg-secondary text-text-muted`
- adverb: `bg-warm-soft text-accent-warm`

---

## Feature 4: Japanese Tokenizer (kuromoji)

Client-side morphological analysis infrastructure for Living Text.

### New file
- `apps/web/lib/kuromoji-tokenizer.ts` — Lazy-loaded singleton. Exports `getTokenizer()`, `tokenizeJapanese(text)`, `isTokenizerReady()`. Dictionary loaded from `/dict/`. Content POS detection via `CONTENT_POS` set (名詞, 動詞, 形容詞, 副詞, 形容動詞, 連体詞).

### Files modified
- `apps/web/package.json` — Added `kuromoji` dependency, `@types/kuromoji` devDep, `postinstall` script to copy dict files to `public/dict/`

### Dict files
Copied from `node_modules/.pnpm/kuromoji@0.1.2/node_modules/kuromoji/dict/` to `apps/web/public/dict/` (12 .gz files).

---

## Feature 5: Living Text + Comprehension Score

### New files
- `apps/web/hooks/use-living-text.ts` — Hook that lazy-loads kuromoji tokenizer, fetches mastery data from `/api/ime/mastery-bulk`, exposes `annotateText(text) -> AnnotatedToken[]` and `computeComprehension(tokens) -> ComprehensionStats`. Mastery-to-tier mapping: `apprentice*` -> apprentice, `journeyman` -> journeyman, etc.
- `apps/web/components/chat/living-text.tsx` — Renders tokenized text. Content words use `VocabPopover` + `VocabToken` (mastery-tier underlines). Non-content words (particles, punctuation) render plain.
- `apps/web/components/chat/comprehension-score.tsx` — Green progress bar + "91% known · 1 new" text. Only renders when total content tokens > 0.

### Files modified
- `apps/web/app/(app)/conversation/page.tsx`:
  - Added `livingTextEnabled` state + `useLivingText()` hook
  - Toggle button (`BookText` icon) in session info sticky bar
  - `livingTextEnabled` and `livingText` passed through `UIMessageRenderer` -> `PartRenderer`
  - `LivingTextPart` helper component: async tokenizes text, renders `LivingText` + `ComprehensionScore` with Markdown fallback while loading

### Existing components reused
- `VocabToken` — tier-based underline styles
- `VocabPopover` — mastery track, meaning display, save action
- `/api/ime/mastery-bulk` — returns `{ [surfaceForm]: { masteryState, id } }`

---

## Implementation Order
1. Features 1 + 2 (parallel — both add tools + system prompt rules + page wiring)
2. Feature 3 (standalone — API route + component)
3. Feature 4 (infrastructure — kuromoji install + singleton)
4. Feature 5 (depends on 4 — hook + components + page integration)

## Typecheck
All features pass `tsc --noEmit` cleanly.
