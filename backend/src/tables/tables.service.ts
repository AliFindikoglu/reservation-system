import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { parseReservationDate } from "../reservations/reservation-date";
import { TableReservationStatus } from "./dto/table-statuses-response.dto";

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

  async findStatuses(date: string, userId: string) {
    const reservationDate = parseReservationDate(date);
    const [reservations, tables] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { reservationDate, isCancelled: false },
        select: { tableId: true, userId: true },
      }),
      this.prisma.table.findMany({
        orderBy: { number: "asc" },
      }),
    ]);
    const reservationsByTableId = new Map(
      reservations.map((reservation) => [
        reservation.tableId,
        reservation,
      ]),
    );

    return {
      date,
      tables: tables.map((table) => {
        const reservation = reservationsByTableId.get(table.id);
        let status = TableReservationStatus.Available;

        if (reservation) {
          status =
            reservation.userId === userId
              ? TableReservationStatus.Mine
              : TableReservationStatus.Reserved;
        }

        return {
          number: table.number,
          status,
        };
      }),
    };
  }
}
