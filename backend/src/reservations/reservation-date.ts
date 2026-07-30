import { BadRequestException } from "@nestjs/common";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getMaximumReservationDaysAhead(): number {
  const value = Number(process.env.MAX_RESERVATION_DAYS_AHEAD ?? 30);
  return Number.isInteger(value) && value >= 0 ? value : 30;
}

function getTodayInBusinessTimeZone(): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.BUSINESS_TIME_ZONE ?? "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function parseReservationDate(value: string): Date {
  if (!DATE_PATTERN.test(value)) {
    throw new BadRequestException(
      "Please enter the reservation date in YYYY-MM-DD format.",
    );
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException("Please enter a valid reservation date.");
  }

  const today = getTodayInBusinessTimeZone();
  if (value < today) {
    throw new BadRequestException("Please select today or a future date.");
  }

  const maximumDate = new Date(`${today}T00:00:00.000Z`);
  maximumDate.setUTCDate(
    maximumDate.getUTCDate() + getMaximumReservationDaysAhead(),
  );
  if (date > maximumDate) {
    throw new BadRequestException(
      `Please select a date within ${getMaximumReservationDaysAhead()} days from today.`,
    );
  }

  return date;
}
