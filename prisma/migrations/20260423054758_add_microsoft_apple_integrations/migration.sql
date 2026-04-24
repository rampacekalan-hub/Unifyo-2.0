-- CreateTable
CREATE TABLE "MicrosoftIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "microsoftEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicrosoftIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppleIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appleId" TEXT NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "principalUrl" TEXT,
    "calendarHomeUrl" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppleIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MicrosoftIntegration_userId_key" ON "MicrosoftIntegration"("userId");

-- CreateIndex
CREATE INDEX "MicrosoftIntegration_expiresAt_idx" ON "MicrosoftIntegration"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppleIntegration_userId_key" ON "AppleIntegration"("userId");

-- AddForeignKey
ALTER TABLE "MicrosoftIntegration" ADD CONSTRAINT "MicrosoftIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppleIntegration" ADD CONSTRAINT "AppleIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
