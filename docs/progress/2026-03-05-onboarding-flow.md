# Onboarding Flow Overhaul

*March 5-6, 2026*

---

## Summary

Built a complete end-to-end onboarding pipeline that takes a new user from the landing page to their first conversation in under 2 minutes. The flow is inspired by Suno's onboarding — minimal friction, fast to value.

## What Was Built

### Landing Page → Get Started Handoff

The landing page prompt input now saves the user's typed prompt to `localStorage` and redirects to `/get-started`. This means the first thing a user types becomes their first conversation — zero wasted intent.

### `/get-started` Page

A dark interstitial page that:
- Shows a preview of the user's prompt ("Here's what you'll practice...")
- Presents a Google OAuth sign-up modal
- Includes "Lingle Beta" branding
- Handles both new users (→ onboarding) and returning users (→ conversation)

### `/onboarding` Wizard

A 4-step onboarding flow:

1. **Language Selection** — Choose target language (Japanese for V1)
2. **Learning Goals** — Multi-select from 6 options (Travel, Career, Exams, Media & Culture, General Fluency, Academic) with emoji icons
3. **Current Level** — 7 CEFR-aligned levels from Complete Beginner to Near-Native, each mapped to a difficulty setting (1-6)
4. **Preparing** — Animated transition before redirecting to the conversation view

### Auth Callback Routing

The OAuth callback (`/auth/callback`) now intelligently routes:
- New users (no `onboardingCompleted` flag) → `/onboarding`
- Returning users → `/conversation`

No more hardcoded redirect paths.

### Profile Creation

New POST handler on `/api/profile` that:
- Creates the learner profile from onboarding data
- Persists `learningGoals` (new field on `LearnerProfile`)
- Sets difficulty level based on self-reported CEFR level

### First Conversation Pre-fill

The conversation view checks `localStorage` for a saved prompt on mount. If found, it pre-fills the chat input so the user's first message is exactly what they typed on the landing page. The prompt is cleared from storage after use.

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/app/get-started/page.tsx` | New — dark interstitial with OAuth modal |
| `apps/web/app/onboarding/page.tsx` | New — 4-step onboarding wizard |
| `apps/web/app/(auth)/auth/callback/route.ts` | Modified — smart routing for new vs. returning users |
| `apps/web/app/api/profile/route.ts` | Modified — added POST handler for profile creation |
| `apps/web/components/conversation-view.tsx` | Modified — localStorage prompt pickup |

## Database Changes

- `LearnerProfile`: Added `learningGoals String[]` field

## Design Decisions

- **Google-only auth** for V1. Email/password adds complexity without clear value at this stage.
- **No placement test in onboarding.** The original CLAUDE.md spec called for a 30-50 item placement test during onboarding. We deferred this — self-reported level is good enough to start, and we'd rather get users into a conversation fast. The knowledge model self-corrects from real interactions anyway.
- **Suno-inspired pattern.** The dark interstitial with a prompt preview creates a moment of anticipation before sign-up. It makes the auth step feel like a gate to something good, not a chore.
