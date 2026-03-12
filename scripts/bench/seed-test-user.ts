/**
 * Seeds the bench test user with a User record and LearnerProfile.
 * Run once after creating the Supabase auth user:
 *   npx tsx scripts/bench/seed-test-user.ts
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const email = process.env.BENCH_USER_EMAIL!
  const password = process.env.BENCH_USER_PASSWORD!

  // Sign in to get the user ID
  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Auth failed: ${error.message}`)
  const userId = data.user!.id
  console.log(`User ID: ${userId}`)

  // Use Prisma to create records
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    // Upsert User
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email,
        name: 'Bench Test User',
        onboardingCompleted: true,
      },
    })
    console.log('User record created/verified.')

    // Upsert LearnerProfile
    await prisma.learnerProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        targetLanguage: 'Japanese',
        nativeLanguage: 'English',
        selfReportedLevel: 'intermediate',
        difficultyLevel: 4,
        computedLevel: 'B1',
        comprehensionCeiling: 'B1',
        productionCeiling: 'A2',
      },
    })
    console.log('LearnerProfile created/verified.')
    console.log('Done! You can now run the benchmark.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
