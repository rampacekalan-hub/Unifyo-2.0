-- Server-side avatar — stored inline as a dataURL thumbnail.
-- Replaces the prior localStorage-only solution that leaked across
-- account switches on a shared browser.
ALTER TABLE "User" ADD COLUMN "avatarDataUrl" TEXT;
