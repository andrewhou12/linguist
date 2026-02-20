-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "targetLanguage" TEXT NOT NULL,
    "nativeLanguage" TEXT NOT NULL,
    "dailyNewItemLimit" INTEGER NOT NULL DEFAULT 10,
    "targetRetention" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LexicalItem" (
    "id" SERIAL NOT NULL,
    "surfaceForm" TEXT NOT NULL,
    "reading" TEXT,
    "meaning" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "masteryState" TEXT NOT NULL DEFAULT 'unseen',
    "recognitionFsrs" JSONB NOT NULL,
    "productionFsrs" JSONB NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" TIMESTAMP(3),
    "exposureCount" INTEGER NOT NULL DEFAULT 0,
    "productionCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'manual',

    CONSTRAINT "LexicalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarItem" (
    "id" SERIAL NOT NULL,
    "patternId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "jlptLevel" TEXT,
    "masteryState" TEXT NOT NULL DEFAULT 'unseen',
    "recognitionFsrs" JSONB NOT NULL,
    "productionFsrs" JSONB NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" TIMESTAMP(3),

    CONSTRAINT "GrammarItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewEvent" (
    "id" SERIAL NOT NULL,
    "itemType" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "lexicalItemId" INTEGER,
    "grammarItemId" INTEGER,

    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSession" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER,
    "transcript" JSONB NOT NULL,
    "targetsPlanned" JSONB NOT NULL,
    "targetsHit" JSONB NOT NULL,
    "errorsLogged" JSONB NOT NULL,
    "avoidanceEvents" JSONB NOT NULL,
    "sessionPlan" JSONB NOT NULL,

    CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TomInference" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "itemIds" INTEGER[],
    "confidence" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "firstDetected" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TomInference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrammarItem_patternId_key" ON "GrammarItem"("patternId");

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_lexicalItemId_fkey" FOREIGN KEY ("lexicalItemId") REFERENCES "LexicalItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_grammarItemId_fkey" FOREIGN KEY ("grammarItemId") REFERENCES "GrammarItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
