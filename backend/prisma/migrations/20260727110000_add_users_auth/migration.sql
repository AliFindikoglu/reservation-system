CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
DROP INDEX "Reservation_reservationCode_key";
DROP INDEX "Reservation_email_reservationDate_key";
ALTER TABLE "Reservation" DROP COLUMN "reservationCode", DROP COLUMN "customerName", DROP COLUMN "email", DROP COLUMN "phone";
ALTER TABLE "Reservation" ADD COLUMN "userId" TEXT NOT NULL;
CREATE UNIQUE INDEX "Reservation_userId_reservationDate_key" ON "Reservation"("userId", "reservationDate");
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
