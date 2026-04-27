-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "currentLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scenarioText" TEXT NOT NULL,
    "professorPrompt" TEXT,
    "studentOpinionA" TEXT,
    "studentOpinionB" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "essayText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "timeSpentSec" INTEGER NOT NULL,
    "overallScore" REAL,
    "rubricScores" JSONB,
    "feedbackJson" JSONB,
    "polishedVersion" TEXT,
    "llmProvider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "promptId" TEXT NOT NULL,
    CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "submissions_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "prompts_mode_difficulty_idx" ON "prompts"("mode", "difficulty");

-- CreateIndex
CREATE INDEX "submissions_userId_idx" ON "submissions"("userId");

-- CreateIndex
CREATE INDEX "submissions_promptId_idx" ON "submissions"("promptId");
