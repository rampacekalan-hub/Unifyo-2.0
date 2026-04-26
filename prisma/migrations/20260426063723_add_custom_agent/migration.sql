-- CreateTable
CREATE TABLE "CustomAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bot',
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomAgent_userId_idx" ON "CustomAgent"("userId");

-- CreateIndex
CREATE INDEX "CustomAgent_userId_isActive_idx" ON "CustomAgent"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "CustomAgent" ADD CONSTRAINT "CustomAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
