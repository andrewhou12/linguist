import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'
import type { ReviewSubmission, FsrsState, LearningModality } from '@linguist/shared/types'
import { MasteryState } from '@linguist/shared/types'
import { scheduleReview } from '@linguist/core/fsrs/scheduler'
import { computeNextMasteryState } from '@linguist/core/mastery/state-machine'
import { recalculateProfile } from '@linguist/core/profile/calculator'
import type { Prisma } from '@prisma/client'

export const POST = withAuth(async (request, { userId }) => {
  const submission: ReviewSubmission = await request.json()

  const prodWeight = submission.productionWeight ?? (submission.modality === 'production' ? 0.5 : 1.0)
  const contextType = submission.contextType ?? 'srs_review'

  await prisma.reviewEvent.create({
    data: {
      userId,
      itemType: submission.itemType,
      grade: submission.grade,
      modality: submission.modality,
      sessionId: submission.sessionId,
      productionWeight: prodWeight,
      contextType,
      lexicalItemId: submission.itemType === 'lexical' ? submission.itemId : null,
      grammarItemId: submission.itemType === 'grammar' ? submission.itemId : null,
    },
  })

  const modality: LearningModality =
    submission.modality === 'production' ? 'writing' : 'reading'

  await prisma.itemContextLog.create({
    data: {
      userId,
      contextType,
      modality,
      wasProduction: submission.modality === 'production',
      wasSuccessful: submission.grade === 'good' || submission.grade === 'easy',
      lexicalItemId: submission.itemType === 'lexical' ? submission.itemId : null,
      grammarItemId: submission.itemType === 'grammar' ? submission.itemId : null,
    },
  })

  const fsrsField =
    submission.modality === 'production' ? 'productionFsrs' : 'recognitionFsrs'

  if (submission.itemType === 'lexical') {
    const item = await prisma.lexicalItem.findUniqueOrThrow({
      where: { id: submission.itemId },
    })
    const currentFsrs = item[fsrsField] as unknown as FsrsState
    const { nextState } = scheduleReview(currentFsrs, submission.grade)

    const newProductionWeight =
      item.productionWeight + (submission.modality === 'production' ? prodWeight : 0)
    const hasProduction = newProductionWeight >= 1.0 || item.productionCount > 0

    const updatedContextTypes = item.contextTypes.includes(contextType)
      ? item.contextTypes
      : [...item.contextTypes, contextType]

    const newMastery = computeNextMasteryState({
      currentState: item.masteryState as MasteryState,
      grade: submission.grade,
      modality: submission.modality,
      hasProductionEvidence: hasProduction,
      productionCount: item.productionCount,
      productionWeight: newProductionWeight,
      contextCount: updatedContextTypes.length,
      novelContextCount: 0,
    })

    const modalityUpdates: Record<string, { increment: number }> = {}
    if (modality === 'reading') modalityUpdates.readingExposures = { increment: 1 }
    else if (modality === 'writing') modalityUpdates.writingProductions = { increment: 1 }

    await prisma.lexicalItem.update({
      where: { id: submission.itemId },
      data: {
        [fsrsField]: nextState as unknown as Prisma.InputJsonValue,
        masteryState: newMastery,
        lastReviewed: new Date(),
        exposureCount: { increment: 1 },
        productionWeight: newProductionWeight,
        contextTypes: updatedContextTypes,
        contextCount: updatedContextTypes.length,
        ...modalityUpdates,
        ...(submission.modality === 'production'
          ? { productionCount: { increment: 1 } }
          : {}),
      },
    })

    return NextResponse.json({ newMasteryState: newMastery })
  } else {
    const item = await prisma.grammarItem.findUniqueOrThrow({
      where: { id: submission.itemId },
    })
    const currentFsrs = item[fsrsField] as unknown as FsrsState
    const { nextState } = scheduleReview(currentFsrs, submission.grade)

    const newProductionWeight =
      item.productionWeight + (submission.modality === 'production' ? prodWeight : 0)

    const updatedContextTypes = item.contextTypes.includes(contextType)
      ? item.contextTypes
      : [...item.contextTypes, contextType]

    const newMastery = computeNextMasteryState({
      currentState: item.masteryState as MasteryState,
      grade: submission.grade,
      modality: submission.modality,
      hasProductionEvidence: newProductionWeight >= 1.0,
      productionCount: 0,
      productionWeight: newProductionWeight,
      contextCount: updatedContextTypes.length,
      novelContextCount: item.novelContextCount,
    })

    const modalityUpdates: Record<string, { increment: number }> = {}
    if (modality === 'reading') modalityUpdates.readingExposures = { increment: 1 }
    else if (modality === 'writing') modalityUpdates.writingProductions = { increment: 1 }

    await prisma.grammarItem.update({
      where: { id: submission.itemId },
      data: {
        [fsrsField]: nextState as unknown as Prisma.InputJsonValue,
        masteryState: newMastery,
        lastReviewed: new Date(),
        productionWeight: newProductionWeight,
        contextTypes: updatedContextTypes,
        contextCount: updatedContextTypes.length,
        ...modalityUpdates,
      },
    })

    return NextResponse.json({ newMasteryState: newMastery })
  }
})
