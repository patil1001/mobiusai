-- Add People identity fields to Wallet model
ALTER TABLE "Wallet"
ADD COLUMN "peopleIdentityStatus" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "peopleDisplay" TEXT;

