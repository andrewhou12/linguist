# Landing Page V4

*March 6, 2026*

---

## Summary

Major overhaul of the marketing landing page. The page is now a polished, animated showcase of Lingle's four modes with a prompt-first interaction model — the first thing a user sees is a text input inviting them to describe what they want to practice.

## What Changed

### Prompt-First Design

The hero section centers a large text input with animated placeholder text that cycles through example prompts. The user's entry point to the product is a single action: type what you want to practice. This connects directly to the onboarding flow — the prompt saves to localStorage and carries through sign-up into the first conversation.

### Mode Showcase

Added a "Reference" mode to the landing page alongside Conversation, Lesson, and Immersion. Each mode now has:
- A subtitle explaining what it does
- Preview content showing what a session looks like
- Level preview data with optional `html` field for furigana rendering (ruby tags for Japanese kanji readings)

### Word Cycle Animation

A rotating text animation in the hero section cycles through what Lingle can be: "conversation partner," "personal tutor," "debate opponent," "interview coach," "travel companion," "listening guide." CSS-driven with smooth transitions.

### Visual Polish

- Logo SVG component with hand-drawn aesthetic
- Extensive CSS animations and transitions (landing.module.css grew from ~100 to 500+ lines)
- Responsive layout
- Dark-themed sections

## Key Files

| File | Lines Changed |
|------|--------------|
| `apps/web/app/page.tsx` | +376/-100 |
| `apps/web/app/landing.module.css` | +544/-100 |

## Design Decisions

- **Prompt-first, not feature-first.** Most language learning app landing pages list features. Ours starts with "what do you want to practice?" The product *is* the prompt → session loop, so the landing page mirrors that.
- **Furigana in previews.** The level preview now renders actual ruby annotations, so even on the landing page, users see what the difficulty system looks like in practice.
