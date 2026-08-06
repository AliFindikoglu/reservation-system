CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK');

ALTER TABLE "User"
ADD COLUMN "preferredOfficeId" TEXT,
ADD COLUMN "themePreference" "ThemePreference" NOT NULL DEFAULT 'LIGHT';

UPDATE "User"
SET "preferredOfficeId" = '00000000-0000-4000-8000-000000000001'
WHERE "preferredOfficeId" IS NULL;

CREATE INDEX "User_preferredOfficeId_idx" ON "User"("preferredOfficeId");

ALTER TABLE "User"
ADD CONSTRAINT "User_preferredOfficeId_fkey"
FOREIGN KEY ("preferredOfficeId") REFERENCES "Office"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
