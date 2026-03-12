import { prisma } from '@lingle/db'

interface CachedSession {
  systemPrompt: string
  sessionPlan: unknown
  mode: string | null
  targetLanguage: string
}

const sessionCache = new Map<string, CachedSession>()

/**
 * Look up session data with in-memory caching.
 * systemPrompt/sessionPlan/mode/targetLanguage never change mid-session.
 */
/**
 * Pre-warm the session cache from the plan route so the first voice-stream call
 * hits the in-memory cache instead of doing a cold DB lookup.
 */
export function warmSessionCache(sessionId: string, data: CachedSession) {
  sessionCache.set(sessionId, data)
}

export async function getSessionWithCache(
  sessionId: string,
  opts?: { bustCache?: boolean },
): Promise<{ session: CachedSession; cacheHit: boolean }> {
  if (opts?.bustCache) {
    sessionCache.delete(sessionId)
  }

  let session = sessionCache.get(sessionId)
  const cacheHit = !!session

  if (!session) {
    const dbSession = await prisma.conversationSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { systemPrompt: true, sessionPlan: true, mode: true, targetLanguage: true },
    })
    if (!dbSession.systemPrompt) throw new Error('Session has no system prompt')
    session = {
      systemPrompt: dbSession.systemPrompt,
      sessionPlan: dbSession.sessionPlan,
      mode: dbSession.mode,
      targetLanguage: dbSession.targetLanguage,
    }
    sessionCache.set(sessionId, session)
  }

  return { session, cacheHit }
}
