/*
  Warnings:

  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits",
ADD COLUMN     "membershipTier" "MembershipTier" NOT NULL DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE "DailyUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeuralMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "module" TEXT NOT NULL DEFAULT 'dashboard',
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "embedding" JSONB,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NeuralMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyUsage_userId_date_idx" ON "DailyUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyUsage_userId_date_key" ON "DailyUsage"("userId", "date");

-- CreateIndex
CREATE INDEX "NeuralMemory_userId_module_idx" ON "NeuralMemory"("userId", "module");

-- CreateIndex
CREATE INDEX "NeuralMemory_createdAt_idx" ON "NeuralMemory"("createdAt");

-- AddForeignKey
ALTER TABLE "DailyUsage" ADD CONSTRAINT "DailyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
