import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { parseDateOnly, parseReservationDate } from "../reservations/reservation-date";
import { TableReservationStatus } from "./dto/table-statuses-response.dto";

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(officeId: string, date: string) {
    await this.assertOfficeActive(officeId);
    const reservationDate = parseReservationDate(date);
    const [reservedTables, assignedTables] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { reservationDate, isCancelled: false, table: { officeId } },
        select: { tableId: true, userId: true, createdByAdminId: true },
      }),
      this.prisma.tableAssignment.findMany({
        where: {
          revokedAt: null,
          table: { officeId },
          startsOn: { lte: reservationDate },
          OR: [{ endsOn: null }, { endsOn: { gte: reservationDate } }],
        },
        select: { tableId: true, userId: true },
      }),
    ]);
    const usersOverriddenByAdmin = new Set(
      reservedTables
        .filter((item) => item.createdByAdminId !== null)
        .map((item) => item.userId),
    );
    const reservedIds = new Set([
      ...reservedTables.map((item) => item.tableId),
      ...assignedTables
        .filter((item) => !usersOverriddenByAdmin.has(item.userId))
        .map((item) => item.tableId),
    ]);
    const tables = await this.prisma.table.findMany({
      where: { officeId },
      orderBy: { number: "asc" },
    });

    return {
      officeId,
      date,
      tableCount: tables.length,
      tables: tables
        .filter((table) => !reservedIds.has(table.id))
        .map((table) => table.number),
    };
  }

  async findStatuses(officeId: string, date: string, userId: string) {
    await this.assertOfficeActive(officeId);
    const reservationDate = parseReservationDate(date);
    const [reservations, assignments, tables] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { reservationDate, isCancelled: false, table: { officeId } },
        select: { tableId: true, userId: true, createdByAdminId: true },
      }),
      this.prisma.tableAssignment.findMany({
        where: {
          revokedAt: null,
          table: { officeId },
          startsOn: { lte: reservationDate },
          OR: [{ endsOn: null }, { endsOn: { gte: reservationDate } }],
        },
        select: { tableId: true, userId: true },
      }),
      this.prisma.table.findMany({
        where: { officeId },
        orderBy: { number: "asc" },
        include: {
          equipments: {
            where: { equipment: { isActive: true } },
            include: { equipment: true },
            orderBy: { equipment: { name: "asc" } },
          },
        },
      }),
    ]);
    const reservationsByTableId = new Map(
      reservations.map((reservation) => [
        reservation.tableId,
        reservation,
      ]),
    );
    const usersOverriddenByAdmin = new Set(
      reservations
        .filter((reservation) => reservation.createdByAdminId !== null)
        .map((reservation) => reservation.userId),
    );
    const assignmentsByTableId = new Map(
      assignments
        .filter(
          (assignment) => !usersOverriddenByAdmin.has(assignment.userId),
        )
        .map((assignment) => [assignment.tableId, assignment]),
    );

    return {
      officeId,
      date,
      tables: tables.map((table) => {
        const reservation = reservationsByTableId.get(table.id);
        const assignment = assignmentsByTableId.get(table.id);
        let status = TableReservationStatus.Available;

        if (reservation) {
          status =
            reservation.userId === userId
              ? TableReservationStatus.Mine
              : TableReservationStatus.Reserved;
        } else if (assignment) {
          status =
            assignment.userId === userId
              ? TableReservationStatus.Mine
              : TableReservationStatus.Reserved;
        }

        return {
          id: table.id,
          number: table.number,
          code: table.code,
          status,
          equipments: table.equipments.map((item) => ({
            id: item.equipment.id,
            code: item.equipment.code,
            name: item.equipment.name,
          })),
        };
      }),
    };
  }

  async findById(id: number) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        office: { select: { id: true, name: true, city: true } },
        equipments: {
          where: { equipment: { isActive: true } },
          include: { equipment: true },
          orderBy: { equipment: { name: "asc" } },
        },
      },
    });
    if (!table) throw new NotFoundException("Table not found.");
    return {
      id: table.id,
      number: table.number,
      code: table.code,
      office: table.office,
      equipments: table.equipments.map((item) => ({
        id: item.equipment.id,
        code: item.equipment.code,
        name: item.equipment.name,
      })),
    };
  }

  async findAdminStatuses(officeId: string, date: string) {
    await this.assertOfficeActive(officeId);
    const reservationDate = parseDateOnly(date, "date");
    const [reservations, assignments, tables] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { reservationDate, isCancelled: false, table: { officeId } },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      }),
      this.prisma.tableAssignment.findMany({
        where: {
          revokedAt: null,
          table: { officeId },
          startsOn: { lte: reservationDate },
          OR: [{ endsOn: null }, { endsOn: { gte: reservationDate } }],
        },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      }),
      this.prisma.table.findMany({
        where: { officeId },
        orderBy: { number: "asc" },
        include: {
          equipments: {
            where: { equipment: { isActive: true } },
            include: { equipment: true },
            orderBy: { equipment: { name: "asc" } },
          },
        },
      }),
    ]);
    const reservationMap = new Map(reservations.map((item) => [item.tableId, item]));
    const usersOverriddenByAdmin = new Set(
      reservations
        .filter((item) => item.createdByAdminId !== null)
        .map((item) => item.userId),
    );
    const allAssignmentMap = new Map(
      assignments.map((item) => [item.tableId, item]),
    );
    const assignmentMap = new Map(
      assignments
        .filter((item) => !usersOverriddenByAdmin.has(item.userId))
        .map((item) => [item.tableId, item]),
    );
    return {
      officeId,
      date,
      tables: tables.map((table) => {
        const reservation = reservationMap.get(table.id);
        const assignment = assignmentMap.get(table.id);
        const underlyingAssignment = allAssignmentMap.get(table.id);
        return {
          id: table.id,
          number: table.number,
          code: table.code,
          status: reservation
            ? reservation.createdByAdminId
              ? "admin_reserved"
              : "reserved"
            : assignment
              ? "assigned"
              : "available",
          occupant: reservation?.user ?? assignment?.user ?? null,
          reservationId: reservation?.id ?? null,
          assignmentId: underlyingAssignment?.id ?? null,
          underlyingAssignment: underlyingAssignment
            ? {
                id: underlyingAssignment.id,
                startsOn: underlyingAssignment.startsOn.toISOString().slice(0, 10),
                endsOn: underlyingAssignment.endsOn?.toISOString().slice(0, 10) ?? null,
                user: underlyingAssignment.user,
              }
            : null,
          equipments: table.equipments.map((item) => ({
            id: item.equipment.id,
            code: item.equipment.code,
            name: item.equipment.name,
          })),
        };
      }),
    };
  }

  private async assertOfficeActive(officeId: string) {
    const office = await this.prisma.office.findFirst({
      where: { id: officeId, isActive: true },
      select: { id: true },
    });
    if (!office) throw new NotFoundException("Office not found.");
  }
}
