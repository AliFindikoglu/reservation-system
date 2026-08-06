-- Preserve cancelled reservations for audit purposes.
ALTER TABLE "Reservation"
ADD COLUMN "isCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- Replace full unique indexes with active-reservation-only constraints.
DROP INDEX "Reservation_tableId_reservationDate_key";
DROP INDEX "Reservation_userId_reservationDate_key";

CREATE UNIQUE INDEX "Reservation_active_table_date_key"
ON "Reservation" ("tableId", "reservationDate")
WHERE "isCancelled" = false;

CREATE UNIQUE INDEX "Reservation_active_user_date_key"
ON "Reservation" ("userId", "reservationDate")
WHERE "isCancelled" = false;
