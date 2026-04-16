-- AlterTable
ALTER TABLE "NeuralMemory" ADD COLUMN     "emotionalTone" TEXT NOT NULL DEFAULT 'neutral',
ADD COLUMN     "isSimulated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "relevanceTTL" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "NeuralMemory_userId_emotionalTone_idx" ON "NeuralMemory"("userId", "emotionalTone");

-- CreateIndex
CREATE INDEX "NeuralMemory_relevanceTTL_idx" ON "NeuralMemory"("relevanceTTL");
