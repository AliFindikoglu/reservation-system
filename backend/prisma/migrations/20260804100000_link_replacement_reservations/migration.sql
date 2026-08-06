ALTER TABLE "Reservation"
ADD COLUMN "replacementForReservationId" TEXT;

CREATE UNIQUE INDEX "Reservation_replacementForReservationId_key"
ON "Reservation"("replacementForReservationId");

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_replacementForReservationId_fkey"
FOREIGN KEY ("replacementForReservationId") REFERENCES "Reservation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
