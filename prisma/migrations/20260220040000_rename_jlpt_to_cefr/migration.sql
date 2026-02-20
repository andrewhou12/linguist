-- Rename jlptLevel columns to cefrLevel
ALTER TABLE "LexicalItem" RENAME COLUMN "jlptLevel" TO "cefrLevel";
ALTER TABLE "GrammarItem" RENAME COLUMN "jlptLevel" TO "cefrLevel";
ALTER TABLE "CurriculumItem" RENAME COLUMN "jlptLevel" TO "cefrLevel";

-- Map JLPT values to CEFR values in LexicalItem
UPDATE "LexicalItem" SET "cefrLevel" = CASE "cefrLevel"
  WHEN 'N5' THEN 'A1'
  WHEN 'N4' THEN 'A2'
  WHEN 'N3' THEN 'B1'
  WHEN 'N2' THEN 'B2'
  WHEN 'N1' THEN 'C1'
  ELSE "cefrLevel"
END WHERE "cefrLevel" IS NOT NULL;

-- Map JLPT values to CEFR values in GrammarItem
UPDATE "GrammarItem" SET "cefrLevel" = CASE "cefrLevel"
  WHEN 'N5' THEN 'A1'
  WHEN 'N4' THEN 'A2'
  WHEN 'N3' THEN 'B1'
  WHEN 'N2' THEN 'B2'
  WHEN 'N1' THEN 'C1'
  ELSE "cefrLevel"
END WHERE "cefrLevel" IS NOT NULL;

-- Map JLPT values to CEFR values in CurriculumItem
UPDATE "CurriculumItem" SET "cefrLevel" = CASE "cefrLevel"
  WHEN 'N5' THEN 'A1'
  WHEN 'N4' THEN 'A2'
  WHEN 'N3' THEN 'B1'
  WHEN 'N2' THEN 'B2'
  WHEN 'N1' THEN 'C1'
  ELSE "cefrLevel"
END WHERE "cefrLevel" IS NOT NULL;

-- Update default values on LearnerProfile columns
ALTER TABLE "LearnerProfile" ALTER COLUMN "computedLevel" SET DEFAULT 'A1';
ALTER TABLE "LearnerProfile" ALTER COLUMN "comprehensionCeiling" SET DEFAULT 'A1';
ALTER TABLE "LearnerProfile" ALTER COLUMN "productionCeiling" SET DEFAULT 'A1';

-- Map JLPT values to CEFR values in LearnerProfile
UPDATE "LearnerProfile" SET
  "computedLevel" = CASE "computedLevel"
    WHEN 'N5' THEN 'A1'
    WHEN 'N4' THEN 'A2'
    WHEN 'N3' THEN 'B1'
    WHEN 'N2' THEN 'B2'
    WHEN 'N1' THEN 'C1'
    ELSE "computedLevel"
  END,
  "comprehensionCeiling" = CASE "comprehensionCeiling"
    WHEN 'N5' THEN 'A1'
    WHEN 'N4' THEN 'A2'
    WHEN 'N3' THEN 'B1'
    WHEN 'N2' THEN 'B2'
    WHEN 'N1' THEN 'C1'
    ELSE "comprehensionCeiling"
  END,
  "productionCeiling" = CASE "productionCeiling"
    WHEN 'N5' THEN 'A1'
    WHEN 'N4' THEN 'A2'
    WHEN 'N3' THEN 'B1'
    WHEN 'N2' THEN 'B2'
    WHEN 'N1' THEN 'C1'
    ELSE "productionCeiling"
  END;
