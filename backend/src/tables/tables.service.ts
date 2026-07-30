import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { parseReservationDate } from "../reservations/reservation-date";

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(date: string) {
    const reservationDate = parseReservationDate(date);
    const reservedTables = await this.prisma.reservation.findMany({
      where: { reservationDate, isCancelled: false },
      select: { tableId: true },
    });
    const reservedIds = new Set(
      reservedTables.map((reservation) => reservation.tableId),
    );
    const tables = await this.prisma.table.findMany({
      orderBy: { number: "asc" },
    });

    return {
      date,
      tables: tables
        .filter((table) => !reservedIds.has(table.id))
        .map((table) => table.number),
    };
  }
}
