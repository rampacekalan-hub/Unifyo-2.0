-- AlterTable
ALTER TABLE "AiRequest" ADD COLUMN "inputTokens"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiRequest" ADD COLUMN "outputTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiRequest" ADD COLUMN "model"        TEXT;

-- Index for cost reports per model
CREATE INDEX "AiRequest_model_createdAt_idx" ON "AiRequest"("model", "createdAt");
