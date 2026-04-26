-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN "weeklyRequests" INTEGER;

-- Backfill existing rows with the canonical FUP weekly limits
-- (5× the daily limit per spec: 200 / 600 / 2000).
UPDATE "MembershipPlan" SET "weeklyRequests" = 200  WHERE "tier" = 'BASIC';
UPDATE "MembershipPlan" SET "weeklyRequests" = 600  WHERE "tier" = 'PREMIUM';
UPDATE "MembershipPlan" SET "weeklyRequests" = 2000 WHERE "tier" = 'ENTERPRISE';
