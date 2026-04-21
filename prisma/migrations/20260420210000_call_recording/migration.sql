-- CallRecording — one row per uploaded audio file.
CREATE TABLE "CallRecording" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "durationSec" INTEGER,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "transcript" TEXT,
    "summary" TEXT,
    "keyPoints" JSONB,
    "actionItems" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CallRecording_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CallRecording_userId_createdAt_idx" ON "CallRecording"("userId", "createdAt");
CREATE INDEX "CallRecording_status_idx" ON "CallRecording"("status");

ALTER TABLE "CallRecording" ADD CONSTRAINT "CallRecording_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
