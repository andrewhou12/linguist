/**
 * Binary frame protocol for the unified voice-stream endpoint.
 *
 * Frame format: [type: uint8][length: uint32 BE][payload: `length` bytes]
 *
 * The server streams interleaved text deltas (for transcript display)
 * and raw PCM audio (for playback) over a single connection, eliminating
 * the browser↔server round-trip per TTS sentence.
 */

export const FRAME = {
  /** UTF-8 text delta from LLM — append to transcript display */
  TEXT_DELTA: 0x01,
  /** Raw PCM Int16LE audio chunk — feed to PCMStreamPlayer */
  AUDIO: 0x02,
  /** UTF-8 sentence text — marks start of TTS audio for this sentence */
  SENTENCE_START: 0x03,
  /** Empty — all audio for current sentence has been sent */
  SENTENCE_END: 0x04,
  /** Empty — stream complete (all text + audio transmitted) */
  DONE: 0x05,
  /** UTF-8 error message */
  ERROR: 0x06,
} as const

const HEADER_SIZE = 5

export function encodeFrame(type: number, payload: Uint8Array): Uint8Array {
  const frame = new Uint8Array(HEADER_SIZE + payload.length)
  frame[0] = type
  const view = new DataView(frame.buffer)
  view.setUint32(1, payload.length, false) // big-endian
  frame.set(payload, HEADER_SIZE)
  return frame
}

export interface VoiceStreamCallbacks {
  onTextDelta: (fullText: string) => void
  onAudioChunk: (pcm: Uint8Array) => void
  onSentenceStart: (sentence: string) => void
  onSentenceEnd: () => void
  onDone: (fullText: string) => void
  onError: (error: string) => void
}

/**
 * Parse a binary voice-stream response into callbacks.
 * Handles frame reassembly across network chunk boundaries.
 */
export async function parseVoiceStream(
  body: ReadableStream<Uint8Array>,
  callbacks: VoiceStreamCallbacks,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = new Uint8Array(0)
  let fullText = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // Append to buffer
      const newBuf = new Uint8Array(buffer.length + value.length)
      newBuf.set(buffer)
      newBuf.set(value, buffer.length)
      buffer = newBuf

      // Parse complete frames
      while (buffer.length >= HEADER_SIZE) {
        const type = buffer[0]
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        const length = view.getUint32(1, false)

        if (buffer.length < HEADER_SIZE + length) break // Incomplete frame

        const payload = buffer.slice(HEADER_SIZE, HEADER_SIZE + length)
        buffer = buffer.slice(HEADER_SIZE + length)

        switch (type) {
          case FRAME.TEXT_DELTA:
            fullText += decoder.decode(payload)
            callbacks.onTextDelta(fullText)
            break
          case FRAME.AUDIO:
            callbacks.onAudioChunk(payload)
            break
          case FRAME.SENTENCE_START:
            callbacks.onSentenceStart(decoder.decode(payload))
            break
          case FRAME.SENTENCE_END:
            callbacks.onSentenceEnd()
            break
          case FRAME.DONE:
            callbacks.onDone(fullText)
            return
          case FRAME.ERROR:
            callbacks.onError(decoder.decode(payload))
            return
        }
      }
    }

    // Stream ended without explicit DONE frame
    callbacks.onDone(fullText)
  } finally {
    reader.releaseLock()
  }
}
