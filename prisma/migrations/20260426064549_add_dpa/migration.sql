-- CreateTable
CREATE TABLE "DpaVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DpaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DpaSignature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerRole" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ico" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "DpaSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DpaVersion_version_key" ON "DpaVersion"("version");

-- CreateIndex
CREATE INDEX "DpaVersion_isActive_effectiveAt_idx" ON "DpaVersion"("isActive", "effectiveAt");

-- CreateIndex
CREATE INDEX "DpaSignature_userId_idx" ON "DpaSignature"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DpaSignature_userId_versionId_key" ON "DpaSignature"("userId", "versionId");

-- AddForeignKey
ALTER TABLE "DpaSignature" ADD CONSTRAINT "DpaSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DpaSignature" ADD CONSTRAINT "DpaSignature_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DpaVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
