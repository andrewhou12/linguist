import referenceCorpus from './data/japanese-reference.json'

export interface ReferenceVocabItem {
  surfaceForm: string
  reading: string
  meaning: string
  partOfSpeech: string
  jlptLevel: string
  frequencyRank: number
}

export interface ReferenceGrammarItem {
  patternId: string
  name: string
  description: string
  jlptLevel: string
  frequencyRank: number
  prerequisiteIds: string[]
}

export interface ReferenceCorpus {
  vocabulary: ReferenceVocabItem[]
  grammar: ReferenceGrammarItem[]
}

let cachedCorpus: ReferenceCorpus | null = null

export function loadJapaneseReferenceCorpus(): ReferenceCorpus {
  if (cachedCorpus) return cachedCorpus
  cachedCorpus = referenceCorpus as ReferenceCorpus
  return cachedCorpus
}

export function getReferenceItemsByLevel(level: string): {
  vocabulary: ReferenceVocabItem[]
  grammar: ReferenceGrammarItem[]
} {
  const corpus = loadJapaneseReferenceCorpus()
  return {
    vocabulary: corpus.vocabulary.filter((v) => v.jlptLevel === level),
    grammar: corpus.grammar.filter((g) => g.jlptLevel === level),
  }
}

export function getReferenceItemsByFrequencyRange(
  min: number,
  max: number
): {
  vocabulary: ReferenceVocabItem[]
  grammar: ReferenceGrammarItem[]
} {
  const corpus = loadJapaneseReferenceCorpus()
  return {
    vocabulary: corpus.vocabulary.filter(
      (v) => v.frequencyRank >= min && v.frequencyRank <= max
    ),
    grammar: corpus.grammar.filter(
      (g) => g.frequencyRank >= min && g.frequencyRank <= max
    ),
  }
}
