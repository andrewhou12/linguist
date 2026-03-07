# Stripe Payment Infrastructure & Daily Usage Limits

*March 6, 2026*

---

## Summary

Implemented a complete payment system with Stripe: free users get 10 minutes of conversation per day, Pro users ($8/month) get unlimited access. Includes checkout, billing portal, webhook handling, usage tracking, and a blocking modal when the daily limit is hit.

## What Was Built

### Usage Tracking

**`DailyUsage` model:** Tracks conversation seconds per user per day. Updated via upsert when a session ends (`/api/conversation/end`).

**`withUsageCheck` middleware:** Wraps the `/api/conversation/send` and `/api/conversation/plan` routes. Before each request:
1. Checks the user's subscription plan
2. Looks up today's `DailyUsage` record
3. Computes live elapsed time for any active (unclosed) sessions
4. Returns 403 with `usage_limit_exceeded` if the total exceeds the plan limit

### Plan Limits

| Plan | Daily Limit | Price |
|------|------------|-------|
| Free | 10 minutes | $0 |
| Pro | Unlimited | $8/month |

### Stripe Integration

**Checkout flow:**
- `/api/stripe/create-checkout-session` creates a Stripe checkout session
- Lazy customer creation — a Stripe customer and subscription record are created on first checkout attempt
- Redirects to Stripe's hosted checkout page
- Success/cancel URLs point back to `/upgrade`

**Webhook handling:**
- `/api/stripe/webhook` processes three events:
  - `checkout.session.completed` — activates the Pro subscription
  - `customer.subscription.updated` — syncs status changes (renewals, plan changes)
  - `customer.subscription.deleted` — downgrades to free

**Billing portal:**
- `/api/stripe/portal` creates a Stripe billing portal session
- Pro users can manage their subscription, update payment method, or cancel

### Client-Side

**`UsageLimitModal`:** A blocking modal that appears mid-conversation when the daily limit is hit. Shows a message explaining the limit and a prominent "Upgrade to Pro" CTA. Cannot be dismissed without upgrading or ending the session.

**`UsageLimitError`:** A typed error class in the API client. When the server returns 403 with `usage_limit_exceeded`, the client throws this specific error, which the conversation view catches and uses to show the modal.

**Usage banner in sidebar:** The `DailyGoalWidget` was renamed to `UsageBanner`. For free users, it shows:
- A progress bar of daily usage (minutes used / 10 min limit)
- Color changes: default → yellow at 80% → red at 100%
- An "Upgrade to Pro" link that becomes "Limit reached — upgrade to Pro" when exhausted

**`/upgrade` page:** Full pricing page with:
- Free vs Pro comparison cards
- One-click Stripe checkout for Pro
- Billing portal access for existing Pro users
- Current usage bar
- Cancellation status display

### API Client Extensions

| Method | Purpose |
|--------|---------|
| `usageGet()` | Fetch daily usage info |
| `subscriptionGet()` | Fetch subscription status |
| `stripeCreateCheckout()` | Create checkout session |
| `stripePortal()` | Get billing portal URL |

## Database Changes

### New Models

```prisma
model Subscription {
  id                   Int       @id @default(autoincrement())
  userId               String    @unique
  plan                 String    @default("free")
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  status               String    @default("active")
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
}

model DailyUsage {
  id                  Int      @id @default(autoincrement())
  userId              String
  date                DateTime @db.Date
  conversationSeconds Int      @default(0)
  @@unique([userId, date])
}
```

### Modified Models

- `User`: Added `subscription` and `dailyUsage` relations
- `ConversationSession`: Added `cachedAnalysis Json?` for caching post-session analysis

### Shared Types

- `PlanType = 'free' | 'pro'`
- `UsageInfo { usedSeconds, limitSeconds, remainingSeconds, isLimitReached, plan }`
- `SubscriptionInfo { plan, status, currentPeriodEnd, cancelAtPeriodEnd }`

## New Environment Variables

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_APP_URL=https://...
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/usage-guard.ts` | Usage check middleware |
| `lib/plan-limits.ts` | Plan limit configuration |
| `lib/stripe.ts` | Stripe SDK singleton |
| `app/api/stripe/create-checkout-session/route.ts` | Checkout session creation |
| `app/api/stripe/portal/route.ts` | Billing portal |
| `app/api/stripe/webhook/route.ts` | Webhook handler |
| `app/api/subscription/route.ts` | Subscription info endpoint |
| `app/api/usage/route.ts` | Usage info endpoint |
| `app/(app)/upgrade/page.tsx` | Pricing / upgrade page |
| `components/usage-limit-modal.tsx` | Blocking limit modal |

## Design Decisions

- **10 minutes free, not messages.** Limiting by time rather than message count is fairer — some learners type short messages, others write paragraphs. Time-based limits also align with how learners think about practice ("I'll study for 10 minutes").
- **$8/month for Pro.** Competitive with language learning apps (Duolingo Plus is ~$7, italki sessions are $15+). Pro gives unlimited conversation time — no per-minute billing, no token counting.
- **Blocking modal, not degraded experience.** When the limit is hit, we don't silently downgrade the AI or add response delays. We show a clear modal explaining what happened and how to continue. Honest gating is better than hidden throttling.
- **Live session time tracking.** The usage check computes elapsed time for active sessions in real-time, not just completed ones. This prevents users from gaming the system by never ending sessions.
