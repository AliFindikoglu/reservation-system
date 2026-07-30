import { validate } from "class-validator";
import { UpdateReservationDto } from "./update-reservation.dto";

describe("UpdateReservationDto", () => {
  it("tarih ve masa alanlarının biri veya ikisini kabul eder", async () => {
    await expect(
      validate(
        Object.assign(new UpdateReservationDto(), {
          tableNumber: 12,
          reservationDate: "2099-01-01",
        }),
      ),
    ).resolves.toHaveLength(0);
    await expect(
      validate(Object.assign(new UpdateReservationDto(), { tableNumber: 12 })),
    ).resolves.toHaveLength(0);
  });

  it.each([
    { tableNumber: null },
    { tableNumber: 0 },
    { tableNumber: 33 },
    { reservationDate: null },
    { reservationDate: "01-01-2099" },
  ])("geçersiz güncelleme alanını reddeder", async (invalid) => {
    await expect(
      validate(Object.assign(new UpdateReservationDto(), invalid)),
    ).resolves.not.toHaveLength(0);
  });
});
