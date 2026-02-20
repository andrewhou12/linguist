import { PrismaClient } from '@prisma/client'
import { createLogger } from './logger'

const log = createLogger('db')

let prisma: PrismaClient | null = null

export function getDb(): PrismaClient {
  if (!prisma) {
    log.info('Initializing PrismaClient')
    prisma = new PrismaClient()
  }
  return prisma
}

export async function disconnectDb(): Promise<void> {
  if (prisma) {
    log.info('Disconnecting PrismaClient')
    await prisma.$disconnect()
    prisma = null
    log.info('PrismaClient disconnected')
  }
}
