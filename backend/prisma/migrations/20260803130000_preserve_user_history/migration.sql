ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_userId_fkey";

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
