import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import { createInitialFsrsState } from '@linguist/core/fsrs/scheduler'
import type { OnboardingResult } from '@linguist/shared/types'
import type { Prisma } from '@prisma/client'
import {
  ASSESSMENT_ITEMS,
  getAssessmentItemsForLevel,
  computeLevelFromChallenges,
  getLevelCefrMapping,
} from '@linguist/core/onboarding/assessment-data'

export const POST = withAuth(async (request, { userId }) => {
  const result: OnboardingResult = await request.json()

  const adjustedLevel = computeLevelFromChallenges(
    result.selfReportedLevel,
    result.readingChallengeResults,
    result.comprehensionResults,
  )
  const cefrLevel = getLevelCefrMapping(adjustedLevel)
  const assessmentItems = getAssessmentItemsForLevel(result.selfReportedLevel)
  const knownSet = new Set(result.knownItemIndices)

  // Clean slate: remove items seeded by a previous onboarding run
  await prisma.lexicalItem.deleteMany({ where: { userId, source: 'onboarding' } })
  await prisma.grammarItem.deleteMany({
    where: {
      userId,
      patternId: { in: ASSESSMENT_ITEMS.filter((i) => i.patternId).map((i) => i.patternId!) },
    },
  })

  await prisma.learnerProfile.upsert({
    where: { userId },
    update: {
      targetLanguage: result.targetLanguage,
      nativeLanguage: result.nativeLanguage,
      selfReportedLevel: result.selfReportedLevel,
      dailyNewItemLimit: result.dailyNewItemLimit,
      computedLevel: cefrLevel,
      comprehensionCeiling: cefrLevel,
      productionCeiling: cefrLevel,
    },
    create: {
      userId,
      targetLanguage: result.targetLanguage,
      nativeLanguage: result.nativeLanguage,
      selfReportedLevel: result.selfReportedLevel,
      dailyNewItemLimit: result.dailyNewItemLimit,
      computedLevel: cefrLevel,
      comprehensionCeiling: cefrLevel,
      productionCeiling: cefrLevel,
    },
  })

  await prisma.pragmaticProfile.upsert({
    where: { userId },
    update: { preferredRegister: 'polite' },
    create: { userId, preferredRegister: 'polite' },
  })

  const initialFsrs = createInitialFsrsState()
  const knownFsrs = {
    ...initialFsrs,
    stability: 2,
    difficulty: 5.5,
    elapsed_days: 1,
    scheduled_days: 2,
    reps: 1,
    state: 2,
    last_review: new Date().toISOString(),
  }

  for (let i = 0; i < assessmentItems.length; i++) {
    const item = assessmentItems[i]
    const isKnown = knownSet.has(i)

    if (item.type === 'vocabulary') {
      await prisma.lexicalItem.create({
        data: {
          userId,
          surfaceForm: item.surfaceForm,
          reading: item.reading,
          meaning: item.meaning,
          partOfSpeech: item.partOfSpeech,
          masteryState: isKnown ? 'apprentice_2' : 'unseen',
          recognitionFsrs: (isKnown ? knownFsrs : initialFsrs) as unknown as Prisma.InputJsonValue,
          productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
          tags: [item.level],
          cefrLevel: getLevelCefrMapping(item.level),
          source: 'onboarding',
          exposureCount: isKnown ? 1 : 0,
        },
      })
    } else if (item.type === 'grammar' && item.patternId) {
      await prisma.grammarItem.create({
        data: {
          userId,
          patternId: item.patternId,
          name: item.surfaceForm,
          description: item.meaning,
          cefrLevel: getLevelCefrMapping(item.level),
          masteryState: isKnown ? 'apprentice_2' : 'unseen',
          recognitionFsrs: (isKnown ? knownFsrs : initialFsrs) as unknown as Prisma.InputJsonValue,
          productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
        },
      })
    }
  }

  // Seed items from levels below the self-reported level as "introduced"
  const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1']
  const reportedIdx = levelOrder.indexOf(result.selfReportedLevel)
  if (reportedIdx > 0) {
    const lowerLevels = levelOrder.slice(0, reportedIdx)
    const lowerItems = ASSESSMENT_ITEMS.filter(
      (item) =>
        lowerLevels.includes(item.level) &&
        !assessmentItems.some(
          (a) => a.surfaceForm === item.surfaceForm && a.level === item.level
        )
    )

    for (const item of lowerItems) {
      if (item.type === 'vocabulary') {
        await prisma.lexicalItem.create({
          data: {
            userId,
            surfaceForm: item.surfaceForm,
            reading: item.reading,
            meaning: item.meaning,
            partOfSpeech: item.partOfSpeech,
            masteryState: 'introduced',
            recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
            productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
            tags: [item.level],
            cefrLevel: getLevelCefrMapping(item.level),
            source: 'onboarding',
          },
        })
      } else if (item.type === 'grammar' && item.patternId) {
        await prisma.grammarItem.create({
          data: {
            userId,
            patternId: item.patternId,
            name: item.surfaceForm,
            description: item.meaning,
            cefrLevel: getLevelCefrMapping(item.level),
            masteryState: 'introduced',
            recognitionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
            productionFsrs: initialFsrs as unknown as Prisma.InputJsonValue,
          },
        })
      }
    }
  }

  // Wipe stale curriculum so it regenerates from the new knowledge state
  await prisma.curriculumItem.deleteMany({ where: { userId } })

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  })

  return NextResponse.json({ computedLevel: cefrLevel })
})
