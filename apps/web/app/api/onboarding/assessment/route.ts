import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { getAssessmentItemsForLevel } from '@lingle/core/onboarding/assessment-data'
import type { SelfReportedLevel } from '@lingle/shared/types'

export const POST = withAuth(async (request) => {
  const { selfReportedLevel } = await request.json()
  const items = getAssessmentItemsForLevel(selfReportedLevel as SelfReportedLevel)
  return NextResponse.json(
    items.map((item, index) => ({
      index,
      surfaceForm: item.surfaceForm,
      reading: item.reading,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech,
      level: item.level,
      type: item.type,
      patternId: item.patternId,
    }))
  )
})
