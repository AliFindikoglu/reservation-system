import { BadRequestException } from "@nestjs/common";
import {
  assertReservationCanBeCancelled,
  assertReservationCanBeUpdated,
  parseReservationDate,
} from "./reservation-date";

describe("parseReservationDate", () => {
  beforeEach(() => {
    process.env.MAX_RESERVATION_DAYS_AHEAD = "30";
  });

  it.each(["2099-02-30", "01-01-2099"])(
    "geçersiz tarih %s için BadRequestException verir",
    (date) => {
      expect(() => parseReservationDate(date)).toThrow(BadRequestException);
    },
  );

  it("geçmiş tarih için BadRequestException verir", () => {
    expect(() => parseReservationDate("2000-01-01")).toThrow(
      BadRequestException,
    );
  });

  it("izin verilen gün sınırını aşan tarih için BadRequestException verir", () => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 31);
    expect(() => parseReservationDate(date.toISOString().slice(0, 10))).toThrow(
      BadRequestException,
    );
  });

  it("geçmiş rezervasyonun güncellenmesini ve iptalini engeller", () => {
    const pastDate = new Date("2000-01-01T00:00:00.000Z");
    expect(() => assertReservationCanBeUpdated(pastDate)).toThrow(
      new BadRequestException("Past reservations cannot be updated."),
    );
    expect(() => assertReservationCanBeCancelled(pastDate)).toThrow(
      new BadRequestException("Past reservations cannot be cancelled."),
    );
  });
});
