-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "sceneDesc" TEXT NOT NULL,
    "emotionScore" INTEGER NOT NULL DEFAULT 50,
    "atmosphere" TEXT NOT NULL DEFAULT 'ambient',
    "ambientSound" TEXT NOT NULL DEFAULT 'cafe',
    "note" TEXT,
    "colorPalette" TEXT NOT NULL DEFAULT '#1ad3e2',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "phonetic" TEXT NOT NULL,
    "masteryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
