import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from './auth'

type AuthContext = { userId: string }

type AuthHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse | Response>

export function withAuth(handler: AuthHandler) {
  return async (request: NextRequest) => {
    try {
      const userId = await getUserId()
      return await handler(request, { userId })
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}
