import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { getAssessmentItemsForLevel } from '@linguist/core/onboarding/assessment-data'
import type { SelfReportedLevel } from '@linguist/shared/types'

export const POST = withAuth(async (request) => {
  const { selfReportedLevel } = await request.json()
  const items = getAssessmentItemsForLevel(selfReportedLevel as SelfReportedLevel)
  return NextResponse.json(items)
})
