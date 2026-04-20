-- Two-factor authentication (TOTP) fields on User.
-- twoFactorSecret: base32 TOTP secret (null if never set up).
-- twoFactorEnabledAt: timestamp when user completed verification;
--   null means the secret is only a pending setup and must not gate login.
-- twoFactorBackupCodes: array of SHA-256 hashes of single-use recovery codes.
ALTER TABLE "User"
  ADD COLUMN "twoFactorSecret"      TEXT,
  ADD COLUMN "twoFactorEnabledAt"   TIMESTAMP(3),
  ADD COLUMN "twoFactorBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
