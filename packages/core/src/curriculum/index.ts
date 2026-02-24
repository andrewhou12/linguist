export {
  loadJapaneseReferenceCorpus,
  getReferenceItemsByLevel,
  getReferenceItemsByFrequencyRange,
  type ReferenceVocabItem,
  type ReferenceGrammarItem,
  type ReferenceCorpus,
} from './reference-data'

export {
  computeKnowledgeBubble,
  identifyGaps,
  type BubbleItemInput,
} from './bubble'

export {
  generateRecommendations,
  checkPrerequisites,
  type RecommendationInput,
} from './recommender'
