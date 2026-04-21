-- Onboarding + preferences fields on User. All nullable so existing
-- rows backfill cleanly. `onboardingCompletedAt IS NULL` drives the
-- redirect-to-/onboarding gate; everything else is pure personalization.
ALTER TABLE "User"
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
  ADD COLUMN "company" TEXT,
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "preferences" JSONB;

-- For existing users we auto-complete onboarding — we don't want to
-- force them through a wizard they never asked for. New signups will
-- have NULL and hit the wizard on first dashboard load.
UPDATE "User" SET "onboardingCompletedAt" = NOW() WHERE "createdAt" < NOW();
