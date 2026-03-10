/**
 * Parses Cartesia's SSE TTS response into a ReadableStream of PCM audio chunks.
 *
 * Cartesia SSE format:
 *   data: {"status_code":206,"done":false,"type":"chunk","data":"<base64 PCM>","step_time":...}
 *   data: {"status_code":200,"done":true,"type":"done"}
 */
export function parseCartesiaSSE(response: Response): ReadableStream<Uint8Array> {
  const body = response.body
  if (!body) throw new Error('No response body from Cartesia')

  const decoder = new TextDecoder()
  let buffer = ''

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader()
      let chunkCount = 0
      let totalBytes = 0
      const t0 = performance.now()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          // Keep the last partial line in the buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue

            const jsonStr = trimmed.slice(5).trim()
            if (!jsonStr) continue

            try {
              const event = JSON.parse(jsonStr)

              if (event.done) {
                controller.close()
                return
              }

              if (event.data && typeof event.data === 'string') {
                const decoded = Buffer.from(event.data, 'base64')
                chunkCount++
                totalBytes += decoded.length
                // MUST copy via slice — decoded.buffer is the Node.js Buffer pool slab
                // (up to 8KB of unrelated data). Only decoded[byteOffset..+byteLength] is ours.
                controller.enqueue(new Uint8Array(decoded.buffer, decoded.byteOffset, decoded.byteLength))
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        console.log(`[cartesia-sse:opt] stream done: ${chunkCount} chunks, ${(totalBytes / 1024).toFixed(1)}KB, ${(performance.now() - t0).toFixed(0)}ms`)

        // Process any remaining buffered data
        if (buffer.trim().startsWith('data:')) {
          const jsonStr = buffer.trim().slice(5).trim()
          if (jsonStr) {
            try {
              const event = JSON.parse(jsonStr)
              if (event.data && typeof event.data === 'string' && !event.done) {
                const d = Buffer.from(event.data, 'base64')
                controller.enqueue(new Uint8Array(d.buffer, d.byteOffset, d.byteLength))
              }
            } catch {
              // ignore
            }
          }
        }

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
