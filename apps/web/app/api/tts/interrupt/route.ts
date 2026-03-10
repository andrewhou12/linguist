import { NextResponse } from 'next/server'
import { getRimeWs } from '@/lib/rime-ws'

export async function POST(request: Request) {
  let ttsProvider = process.env.TTS_PROVIDER || 'cartesia'
  try {
    const body = await request.json()
    if (body.ttsProvider === 'rime' || body.ttsProvider === 'elevenlabs' || body.ttsProvider === 'cartesia') ttsProvider = body.ttsProvider
  } catch { /* empty body is fine */ }
  if (ttsProvider === 'rime') {
    getRimeWs().clear()
  }
  // Cartesia SSE uses per-request HTTP calls — no server-side connection to cancel.
  // Client-side AbortController in use-voice-tts.ts handles fetch cancellation.
  return NextResponse.json({ ok: true })
}
