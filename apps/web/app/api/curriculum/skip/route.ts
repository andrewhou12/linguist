import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-helpers'
import { prisma } from '@linguist/db'

export const POST = withAuth(async (request) => {
  const { curriculumItemId } = await request.json()
  await prisma.curriculumItem.update({
    where: { id: curriculumItemId },
    data: { status: 'skipped' },
  })
  return NextResponse.json({ success: true })
})
