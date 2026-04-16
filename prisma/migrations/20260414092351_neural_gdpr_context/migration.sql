-- AlterTable
ALTER TABLE "NeuralMemory" ADD COLUMN     "anonymizedContent" TEXT,
ADD COLUMN     "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "context" TEXT NOT NULL DEFAULT 'work';

-- CreateIndex
CREATE INDEX "NeuralMemory_userId_context_idx" ON "NeuralMemory"("userId", "context");
