import WebSocket from 'ws'

const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY || ''
const WS_URL = 'wss://api.cartesia.ai/tts/websocket'
const CARTESIA_VERSION = '2024-06-10'
const RECONNECT_DELAY_MS = 500
const IDLE_TIMEOUT_MS = 30_000 // Close idle connection after 30s
const SYNTHESIS_TIMEOUT_MS = 10_000

interface CartesiaRequest {
  model_id: string
  transcript: string
  voice: {
    mode: 'id'
    id: string
    __experimental_controls?: { speed: number; emotion?: string[] }
  }
  language: string
  output_format: {
    container: 'raw'
    encoding: 'pcm_s16le'
    sample_rate: number
  }
  context_id: string
}

interface CartesiaChunk {
  type: 'chunk'
  data: string // base64
  context_id: string
  status_code: number
  done: boolean
}

interface CartesiaDone {
  type: 'done'
  context_id: string
  status_code: number
  done: true
}

interface CartesiaError {
  type: 'error'
  error: string
  context_id?: string
  status_code: number
  done: boolean
}

type CartesiaMessage = CartesiaChunk | CartesiaDone | CartesiaError

type PendingContext = {
  controller: ReadableStreamDefaultController<Uint8Array>
  closed: boolean
  timeout: ReturnType<typeof setTimeout>
}

let contextCounter = 0

class CartesiaWebSocket {
  private ws: WebSocket | null = null
  private connecting = false
  private pending = new Map<string, PendingContext>()
  private idleTimer: ReturnType<typeof setTimeout> | null = null

  private getUrl(): string {
    return `${WS_URL}?cartesia_version=${CARTESIA_VERSION}&api_key=${CARTESIA_API_KEY}`
  }

  private resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      if (this.pending.size === 0) {
        console.log('[cartesia-ws] idle timeout — closing connection')
        this.disconnect()
      }
    }, IDLE_TIMEOUT_MS)
  }

  private async connect(): Promise<WebSocket> {
    if (this.ws?.readyState === WebSocket.OPEN) return this.ws

    if (this.connecting) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(check)
            resolve(this.ws!)
          } else if (!this.connecting) {
            clearInterval(check)
            reject(new Error('Cartesia WS connection failed'))
          }
        }, 50)
      })
    }

    this.connecting = true
    return new Promise((resolve, reject) => {
      const url = this.getUrl()
      console.log('[cartesia-ws] connecting')
      const ws = new WebSocket(url)

      ws.on('open', () => {
        console.log('[cartesia-ws] connected')
        this.ws = ws
        this.connecting = false
        this.resetIdleTimer()
        resolve(ws)
      })

      ws.on('message', (data: WebSocket.Data) => {
        this.resetIdleTimer()
        try {
          const msg = JSON.parse(data.toString()) as CartesiaMessage
          const ctxId = msg.context_id || (msg as CartesiaError).context_id
          if (!ctxId) return

          const ctx = this.pending.get(ctxId)
          if (!ctx || ctx.closed) return

          if (msg.type === 'error') {
            console.error(`[cartesia-ws] error ctx=${ctxId}:`, (msg as CartesiaError).error)
            ctx.closed = true
            clearTimeout(ctx.timeout)
            ctx.controller.close()
            this.pending.delete(ctxId)
            return
          }

          if (msg.type === 'chunk' && (msg as CartesiaChunk).data) {
            const buf = Buffer.from((msg as CartesiaChunk).data, 'base64')
            ctx.controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength))
          }

          if (msg.type === 'done' || (msg as CartesiaChunk).done) {
            ctx.closed = true
            clearTimeout(ctx.timeout)
            ctx.controller.close()
            this.pending.delete(ctxId)
          }
        } catch {
          // Skip malformed messages
        }
      })

      ws.on('close', (code, reason) => {
        console.log('[cartesia-ws] closed:', code, reason?.toString())
        this.ws = null
        this.connecting = false
        // Fail all pending contexts
        for (const [id, ctx] of this.pending) {
          if (!ctx.closed) {
            ctx.closed = true
            clearTimeout(ctx.timeout)
            ctx.controller.close()
          }
          this.pending.delete(id)
        }
      })

      ws.on('error', (err) => {
        console.error('[cartesia-ws] error:', err.message)
        this.ws = null
        this.connecting = false
        reject(err)
      })
    })
  }

  /**
   * Synthesize text to a PCM audio stream via persistent WebSocket.
   * Returns a ReadableStream of PCM Uint8Array chunks.
   */
  synthesize(opts: {
    transcript: string
    voiceId: string
    language: string
    sampleRate: number
    controls?: { speed: number; emotion?: string[] }
  }): ReadableStream<Uint8Array> {
    const contextId = `ctx_${Date.now()}_${++contextCounter}`

    let pending: PendingContext

    return new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const timeout = setTimeout(() => {
          if (pending && !pending.closed) {
            console.warn(`[cartesia-ws] synthesis timeout ctx=${contextId}`)
            pending.closed = true
            controller.close()
            this.pending.delete(contextId)
          }
        }, SYNTHESIS_TIMEOUT_MS)

        pending = { controller, closed: false, timeout }
        this.pending.set(contextId, pending)

        try {
          let ws: WebSocket
          try {
            ws = await this.connect()
          } catch {
            // Retry once after delay
            await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS))
            ws = await this.connect()
          }

          const request: CartesiaRequest = {
            model_id: 'sonic-multilingual',
            transcript: opts.transcript,
            voice: {
              mode: 'id',
              id: opts.voiceId,
              ...(opts.controls && { __experimental_controls: opts.controls }),
            },
            language: opts.language,
            output_format: {
              container: 'raw',
              encoding: 'pcm_s16le',
              sample_rate: opts.sampleRate,
            },
            context_id: contextId,
          }

          ws.send(JSON.stringify(request))
        } catch (err) {
          clearTimeout(timeout)
          pending.closed = true
          this.pending.delete(contextId)
          controller.error(err)
        }
      },
      cancel: () => {
        const ctx = this.pending.get(contextId)
        if (ctx) {
          ctx.closed = true
          clearTimeout(ctx.timeout)
          this.pending.delete(contextId)
        }
        // Send cancel message if connection is open
        if (this.ws?.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ context_id: contextId, cancel: true }))
          } catch { /* ignore */ }
        }
      },
    })
  }

  /** Pre-warm the WebSocket connection (call before first synthesize to hide handshake latency) */
  warmup() {
    if (this.ws?.readyState === WebSocket.OPEN || this.connecting) return
    console.log('[cartesia-ws] warmup — pre-connecting')
    this.connect().catch((err) => {
      console.warn('[cartesia-ws] warmup failed:', err.message)
    })
  }

  disconnect() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
    for (const [id, ctx] of this.pending) {
      if (!ctx.closed) {
        ctx.closed = true
        clearTimeout(ctx.timeout)
        try { ctx.controller.close() } catch { /* ignore */ }
      }
      this.pending.delete(id)
    }
    if (this.ws) {
      try { this.ws.close() } catch { /* ignore */ }
      this.ws = null
    }
  }
}

// Module-level singleton
let instance: CartesiaWebSocket | null = null

export function getCartesiaWs(): CartesiaWebSocket {
  if (!instance) {
    instance = new CartesiaWebSocket()
  }
  return instance
}
