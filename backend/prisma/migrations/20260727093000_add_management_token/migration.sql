ALTER TABLE "Reservation" ADD COLUMN "managementToken" TEXT;

UPDATE "Reservation"
SET "managementToken" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "managementToken" IS NULL;

ALTER TABLE "Reservation" ALTER COLUMN "managementToken" SET NOT NULL;

CREATE UNIQUE INDEX "Reservation_managementToken_key" ON "Reservation"("managementToken");
