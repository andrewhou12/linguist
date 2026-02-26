export {
  loadJapaneseReferenceCorpus,
  getReferenceItemsByLevel,
  getReferenceItemsByFrequencyRange,
  getAssessmentCandidates,
  getItemBySurfaceForm,
  getItemByPatternId,
  getItemsForLevel,
  getItemsAtOrBelowLevel,
  getItemsBelowLevel,
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

export {
  generateCurriculumPlan,
  type CurriculumPlan,
  type PlannerInput,
} from './planner'
