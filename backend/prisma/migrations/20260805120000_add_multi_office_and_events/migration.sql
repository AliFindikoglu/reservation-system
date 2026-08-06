CREATE TYPE "EventSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE "Office" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Office_name_key" ON "Office"("name");
CREATE UNIQUE INDEX "Office_city_key" ON "Office"("city");

INSERT INTO "Office" ("id", "name", "city", "isActive", "updatedAt")
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Istanbul Office', 'Istanbul', true, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000002', 'Izmir Office', 'Izmir', true, CURRENT_TIMESTAMP);

ALTER TABLE "Table" ADD COLUMN "officeId" TEXT;

UPDATE "Table"
SET "officeId" = '00000000-0000-4000-8000-000000000001';

ALTER TABLE "Table" ALTER COLUMN "officeId" SET NOT NULL;

DROP INDEX IF EXISTS "Table_number_key";
DROP INDEX IF EXISTS "Table_code_key";

CREATE UNIQUE INDEX "Table_officeId_number_key" ON "Table"("officeId", "number");
CREATE UNIQUE INDEX "Table_officeId_code_key" ON "Table"("officeId", "code");
CREATE INDEX "Table_officeId_idx" ON "Table"("officeId");

ALTER TABLE "Table"
ADD CONSTRAINT "Table_officeId_fkey"
FOREIGN KEY ("officeId") REFERENCES "Office"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Table" ("number", "code", "officeId")
SELECT
  value,
  CHR(65 + ((value - 1) / 8)) || (((value - 1) % 8) + 1)::TEXT,
  '00000000-0000-4000-8000-000000000002'
FROM generate_series(1, 16) AS value
ON CONFLICT ("officeId", "number") DO NOTHING;

CREATE TABLE "EventSuggestion" (
  "id" TEXT NOT NULL,
  "suggestionText" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL,
  "status" "EventSuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "userId" TEXT NOT NULL,
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventSuggestion_status_createdAt_idx" ON "EventSuggestion"("status", "createdAt");
CREATE INDEX "EventSuggestion_userId_createdAt_idx" ON "EventSuggestion"("userId", "createdAt");
CREATE UNIQUE INDEX "EventSuggestion_one_pending_text_per_user_key"
ON "EventSuggestion"("userId", "normalizedText") WHERE "status" = 'PENDING';

CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "location" TEXT NOT NULL,
  "isCancelled" BOOLEAN NOT NULL DEFAULT false,
  "cancelledAt" TIMESTAMP(3),
  "cancelledByAdminId" TEXT,
  "cancellationReason" TEXT,
  "createdByAdminId" TEXT NOT NULL,
  "sourceSuggestionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Event_valid_time_range_check" CHECK ("endsAt" > "startsAt")
);

CREATE UNIQUE INDEX "Event_sourceSuggestionId_key" ON "Event"("sourceSuggestionId");
CREATE INDEX "Event_startsAt_endsAt_idx" ON "Event"("startsAt", "endsAt");
CREATE INDEX "Event_isCancelled_startsAt_idx" ON "Event"("isCancelled", "startsAt");
CREATE INDEX "Event_createdByAdminId_idx" ON "Event"("createdByAdminId");

CREATE TABLE "EventReview" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "deletedByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "EventReview_eventId_userId_key" ON "EventReview"("eventId", "userId");
CREATE INDEX "EventReview_eventId_isDeleted_createdAt_idx" ON "EventReview"("eventId", "isDeleted", "createdAt");
CREATE INDEX "EventReview_userId_createdAt_idx" ON "EventReview"("userId", "createdAt");

ALTER TABLE "EventSuggestion"
ADD CONSTRAINT "EventSuggestion_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventSuggestion"
ADD CONSTRAINT "EventSuggestion_reviewedByAdminId_fkey"
FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Event"
ADD CONSTRAINT "Event_createdByAdminId_fkey"
FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Event"
ADD CONSTRAINT "Event_cancelledByAdminId_fkey"
FOREIGN KEY ("cancelledByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Event"
ADD CONSTRAINT "Event_sourceSuggestionId_fkey"
FOREIGN KEY ("sourceSuggestionId") REFERENCES "EventSuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventReview"
ADD CONSTRAINT "EventReview_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventReview"
ADD CONSTRAINT "EventReview_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventReview"
ADD CONSTRAINT "EventReview_deletedByAdminId_fkey"
FOREIGN KEY ("deletedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
