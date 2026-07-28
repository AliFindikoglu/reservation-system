-- CreateIndex
CREATE UNIQUE INDEX "Reservation_email_reservationDate_key" ON "Reservation"("email", "reservationDate");
