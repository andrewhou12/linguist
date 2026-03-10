import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lingle/db'
import { getDailyLimitSeconds, type PlanType } from './plan-limits'

export type AuthContext = { userId: string }
type AuthHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse | Response>

export interface UsageInfo {
  remainingSeconds: number
  plan: PlanType
}

/** Compute remaining daily conversation seconds for a user. */
export async function getUsageInfo(userId: string): Promise<UsageInfo> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [usage, subscription] = await Promise.all([
    prisma.dailyUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    prisma.subscription.findUnique({ where: { userId } }),
  ])

  const plan: PlanType = subscription?.plan === 'pro' ? 'pro' : 'free'
  const limitSeconds = getDailyLimitSeconds(plan)
  const completedSeconds = usage?.conversationSeconds ?? 0
  const remainingSeconds = Math.max(0, limitSeconds - completedSeconds)

  return { remainingSeconds, plan }
}

export function withUsageCheck(handler: AuthHandler): AuthHandler {
  return async (request, context) => {
    const { userId } = context
    const { remainingSeconds, plan } = await getUsageInfo(userId)

    if (remainingSeconds <= 0) {
      return NextResponse.json(
        {
          error: 'usage_limit_exceeded',
          remainingSeconds: 0,
          plan,
        },
        { status: 403 }
      )
    }

    return handler(request, context)
  }
}
