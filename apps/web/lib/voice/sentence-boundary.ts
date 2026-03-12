const SENTENCE_ENDINGS = /[。！？.!?\n]/
const JP_QUOTE_END = /」\s/
const CLAUSE_BOUNDARIES = /[、,]/
const MAX_FLUSH_LENGTH = 120
// Minimum chars before we'll flush on a clause boundary (avoid tiny fragments)
const MIN_CLAUSE_FLUSH = 3

export interface SentenceBoundaryTracker {
  /** Feed new text (full accumulated text). Returns newly completed sentences. */
  feed(fullText: string): string[]
  /** Force-flush any remaining buffered text. Returns the remaining unflushed text. */
  flush(fullText: string): string | null
  /** Reset the tracker. */
  reset(): void
  /** Enable eager clause-level flushing for the first sentence (lower latency to first audio) */
  setEagerMode(eager: boolean): void
}

// Number of clause-level eager flushes before falling back to sentence-only boundaries
const MAX_EAGER_CLAUSES = 3

export function createSentenceBoundaryTracker(): SentenceBoundaryTracker {
  let cursor = 0
  let eagerMode = false
  let eagerCount = 0

  return {
    feed(fullText: string): string[] {
      const sentences: string[] = []
      const newText = fullText.slice(cursor)

      let searchStart = 0
      for (let i = 0; i < newText.length; i++) {
        const char = newText[i]
        const remaining = newText.slice(i)

        if (SENTENCE_ENDINGS.test(char) || JP_QUOTE_END.test(remaining.slice(0, 2))) {
          const sentence = newText.slice(searchStart, i + 1).trim()
          if (sentence) {
            sentences.push(sentence)
            if (eagerMode && eagerCount < MAX_EAGER_CLAUSES) eagerCount++
          }
          searchStart = i + 1
        }
        // Eager mode: flush on clause boundaries (、,) for the first N clauses to pipeline TTS
        else if (eagerMode && eagerCount < MAX_EAGER_CLAUSES && CLAUSE_BOUNDARIES.test(char)) {
          const clause = newText.slice(searchStart, i + 1).trim()
          if (clause && clause.length >= MIN_CLAUSE_FLUSH) {
            console.log(`[sentence:opt] EAGER clause flush #${eagerCount + 1} (${clause.length} chars): "${clause.slice(0, 40)}"`)
            sentences.push(clause)
            searchStart = i + 1
            eagerCount++
          }
        }
      }

      // Fallback: force flush after MAX_FLUSH_LENGTH chars with no boundary
      const unflushed = newText.slice(searchStart)
      if (unflushed.length >= MAX_FLUSH_LENGTH) {
        // Find the last space or comma to break at
        let breakAt = -1
        for (let i = unflushed.length - 1; i >= 0; i--) {
          if (unflushed[i] === '、' || unflushed[i] === ',' || unflushed[i] === ' ') {
            breakAt = i
            break
          }
        }
        if (breakAt > 0) {
          const sentence = unflushed.slice(0, breakAt + 1).trim()
          if (sentence) {
            sentences.push(sentence)
            searchStart += breakAt + 1
          }
        }
      }

      cursor += searchStart
      return sentences
    },

    flush(fullText: string): string | null {
      const remaining = fullText.slice(cursor).trim()
      cursor = fullText.length
      return remaining || null
    },

    reset() {
      cursor = 0
      eagerCount = 0
    },

    setEagerMode(eager: boolean) {
      eagerMode = eager
    },
  }
}
