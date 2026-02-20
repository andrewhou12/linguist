-- AlterTable
ALTER TABLE "GrammarItem" ADD COLUMN     "contextCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contextTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "frequencyRank" INTEGER,
ADD COLUMN     "listeningExposures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "novelContextCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prerequisiteIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "productionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "readingExposures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "speakingProductions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "writingProductions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN     "avoidancePatternSummary" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "comprehensionCeiling" TEXT NOT NULL DEFAULT 'N5',
ADD COLUMN     "computedLevel" TEXT NOT NULL DEFAULT 'N5',
ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "errorPatternSummary" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "lastActiveDate" TIMESTAMP(3),
ADD COLUMN     "listeningLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productionCeiling" TEXT NOT NULL DEFAULT 'N5',
ADD COLUMN     "readingLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "speakingLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalReviewEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSessions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "writingLevel" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LexicalItem" ADD COLUMN     "contextCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contextTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "frequencyRank" INTEGER,
ADD COLUMN     "jlptLevel" TEXT,
ADD COLUMN     "listeningExposures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "readingExposures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "speakingProductions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "writingProductions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReviewEvent" ADD COLUMN     "contextType" TEXT,
ADD COLUMN     "productionWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "ItemContextLog" (
    "id" SERIAL NOT NULL,
    "contextType" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "wasProduction" BOOLEAN NOT NULL DEFAULT false,
    "wasSuccessful" BOOLEAN,
    "contextQuote" TEXT,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lexicalItemId" INTEGER,
    "grammarItemId" INTEGER,

    CONSTRAINT "ItemContextLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PragmaticProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "casualAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "politeAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "registerSlipCount" INTEGER NOT NULL DEFAULT 0,
    "preferredRegister" TEXT NOT NULL DEFAULT 'polite',
    "circumlocutionCount" INTEGER NOT NULL DEFAULT 0,
    "silenceEvents" INTEGER NOT NULL DEFAULT 0,
    "l1FallbackCount" INTEGER NOT NULL DEFAULT 0,
    "averageSpeakingPace" DOUBLE PRECISION,
    "hesitationRate" DOUBLE PRECISION,
    "avoidedGrammarPatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoidedVocabIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PragmaticProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumItem" (
    "id" SERIAL NOT NULL,
    "itemType" TEXT NOT NULL,
    "referenceItemId" INTEGER,
    "surfaceForm" TEXT,
    "reading" TEXT,
    "meaning" TEXT,
    "patternId" TEXT,
    "jlptLevel" TEXT,
    "frequencyRank" INTEGER,
    "priority" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "introducedAt" TIMESTAMP(3),

    CONSTRAINT "CurriculumItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemContextLog_lexicalItemId_timestamp_idx" ON "ItemContextLog"("lexicalItemId", "timestamp");

-- CreateIndex
CREATE INDEX "ItemContextLog_grammarItemId_timestamp_idx" ON "ItemContextLog"("grammarItemId", "timestamp");

-- CreateIndex
CREATE INDEX "CurriculumItem_status_priority_idx" ON "CurriculumItem"("status", "priority");

-- AddForeignKey
ALTER TABLE "ItemContextLog" ADD CONSTRAINT "ItemContextLog_lexicalItemId_fkey" FOREIGN KEY ("lexicalItemId") REFERENCES "LexicalItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemContextLog" ADD CONSTRAINT "ItemContextLog_grammarItemId_fkey" FOREIGN KEY ("grammarItemId") REFERENCES "GrammarItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
