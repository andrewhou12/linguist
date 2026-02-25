import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { getReadingChallengeItems } from '@linguist/core/onboarding/assessment-data'
import type { SelfReportedLevel } from '@linguist/shared/types'

export const POST = withAuth(async (request) => {
  const { selfReportedLevel } = await request.json()
  const items = getReadingChallengeItems(selfReportedLevel as SelfReportedLevel)
  return NextResponse.json(
    items.map((item, index) => ({
      index,
      surfaceForm: item.surfaceForm,
      meaning: item.meaning,
      level: item.level,
    }))
  )
})
