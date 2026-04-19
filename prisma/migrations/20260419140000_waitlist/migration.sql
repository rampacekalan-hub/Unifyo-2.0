-- CreateTable
CREATE TABLE "WaitlistSignup" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSignup_feature_email_key" ON "WaitlistSignup"("feature", "email");

-- CreateIndex
CREATE INDEX "WaitlistSignup_feature_createdAt_idx" ON "WaitlistSignup"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistSignup_userId_idx" ON "WaitlistSignup"("userId");

-- AddForeignKey
ALTER TABLE "WaitlistSignup" ADD CONSTRAINT "WaitlistSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
