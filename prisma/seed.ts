import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_USER_ID = 'seed-test-user-001'

async function main() {
  console.log('Seeding database...\n')

  // Clear existing data (order matters for foreign keys)
  await prisma.itemContextLog.deleteMany()
  await prisma.reviewEvent.deleteMany()
  await prisma.lexicalItem.deleteMany()
  await prisma.grammarItem.deleteMany()
  await prisma.conversationSession.deleteMany()
  await prisma.tomInference.deleteMany()
  await prisma.curriculumItem.deleteMany()
  await prisma.pragmaticProfile.deleteMany()
  await prisma.learnerProfile.deleteMany()
  await prisma.user.deleteMany()

  // Create test user
  const user = await prisma.user.create({
    data: {
      id: TEST_USER_ID,
      email: 'test@lingle.ai',
      name: 'Test Learner',
      onboardingCompleted: true,
    },
  })
  console.log(`  User created (id=${user.id}, ${user.email})`)

  // Create learner profile
  const profile = await prisma.learnerProfile.create({
    data: {
      userId: TEST_USER_ID,
      targetLanguage: 'Japanese',
      nativeLanguage: 'English',
    },
  })
  console.log(`  LearnerProfile created (id=${profile.id}, ${profile.targetLanguage})`)

  console.log(`\nSeed complete!`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
