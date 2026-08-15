-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "ambientSoundUrl" TEXT,
ADD COLUMN     "becauseText" TEXT,
ADD COLUMN     "bodyPlan" TEXT,
ADD COLUMN     "nextDueDate" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "promotedAt" TIMESTAMP(3),
ADD COLUMN     "sensorySize" TEXT,
ADD COLUMN     "sensoryTextures" TEXT[],
ADD COLUMN     "srsRung" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageBand" TEXT,
ADD COLUMN     "checkpointDoneAt" TIMESTAMP(3),
ADD COLUMN     "dayObjectWordId" TEXT,
ADD COLUMN     "peakBPendingAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EvidenceStore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "sentenceText" TEXT NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "gateChosen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collectible" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "posX" INTEGER NOT NULL,
    "posY" INTEGER NOT NULL,
    "dim" BOOLEAN NOT NULL DEFAULT true,
    "settledPhotoUrl" TEXT,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collectible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicShimmer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "cefrBand" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicShimmer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvidenceStore_userId_idx" ON "EvidenceStore"("userId");

-- CreateIndex
CREATE INDEX "EvidenceStore_wordId_idx" ON "EvidenceStore"("wordId");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalEntry_wordId_idx" ON "JournalEntry"("wordId");

-- CreateIndex
CREATE INDEX "Collectible_userId_dim_idx" ON "Collectible"("userId", "dim");

-- CreateIndex
CREATE UNIQUE INDEX "Collectible_userId_wordId_key" ON "Collectible"("userId", "wordId");

-- CreateIndex
CREATE INDEX "TopicShimmer_userId_idx" ON "TopicShimmer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicShimmer_userId_topic_cefrBand_key" ON "TopicShimmer"("userId", "topic", "cefrBand");

-- CreateIndex
CREATE INDEX "Word_nextDueDate_idx" ON "Word"("nextDueDate");

-- CreateIndex
CREATE INDEX "Word_promotedAt_idx" ON "Word"("promotedAt");

-- AddForeignKey
ALTER TABLE "EvidenceStore" ADD CONSTRAINT "EvidenceStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceStore" ADD CONSTRAINT "EvidenceStore_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collectible" ADD CONSTRAINT "Collectible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collectible" ADD CONSTRAINT "Collectible_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicShimmer" ADD CONSTRAINT "TopicShimmer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

