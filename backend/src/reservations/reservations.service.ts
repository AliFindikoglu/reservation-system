import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { UpdateReservationDto } from "./dto/update-reservation.dto";
import {
  assertReservationCanBeCancelled,
  assertReservationCanBeUpdated,
  parseReservationDate,
} from "./reservation-date";

const reservationResponseInclude = {
  table: {
    include: {
      office: true,
      equipments: {
        where: { equipment: { isActive: true } },
        include: { equipment: true },
        orderBy: { equipment: { name: "asc" } },
      },
    },
  },
} satisfies Prisma.ReservationInclude;

type ReservationResponseRecord = Prisma.ReservationGetPayload<{
  include: typeof reservationResponseInclude;
}>;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservationDto) {
    const reservationDate = parseReservationDate(dto.reservationDate);
    const table = await this.findTable(dto.officeId, dto.tableNumber);
    await this.assertReservationAllowed(userId, table.id, reservationDate);
    const exact = await this.prisma.reservation.findFirst({
      where: {
        userId,
        tableId: table.id,
        reservationDate,
        isCancelled: false,
      },
    });
    if (exact) {
      throw new ConflictException("This reservation already exists.");
    }
    try {
      const reservation = await this.prisma.reservation.create({
        data: { userId, tableId: table.id, reservationDate },
        include: reservationResponseInclude,
      });
      return this.toResponse(reservation);
    } catch (error) {
      this.handleConflict(error);
      throw error;
    }
  }

  async findMyReservations(userId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId, isCancelled: false },
      include: reservationResponseInclude,
      orderBy: { reservationDate: "asc" },
    });
    return reservations.map((reservation) => this.toResponse(reservation));
  }

  async update(id: string, userId: string, dto: UpdateReservationDto) {
    const existing = await this.findOwned(id, userId);
    if (existing.isCancelled) {
      throw new BadRequestException(
        "Cancelled reservations cannot be modified.",
      );
    }
    assertReservationCanBeUpdated(existing.reservationDate);
    if (
      dto.reservationDate === undefined &&
      dto.tableNumber === undefined &&
      dto.officeId === undefined
    ) {
      throw new BadRequestException(
        "Please provide a reservation date or table number to update.",
      );
    }
    if (
      (dto.officeId === undefined) !== (dto.tableNumber === undefined)
    ) {
      throw new BadRequestException(
        "Please provide both the office ID and table number when changing the table.",
      );
    }

    const reservationDate = dto.reservationDate
      ? parseReservationDate(dto.reservationDate)
      : existing.reservationDate;
    const tableId = dto.tableNumber && dto.officeId
      ? (await this.findTable(dto.officeId, dto.tableNumber)).id
      : existing.tableId;
    await this.assertReservationAllowed(
      userId,
      tableId,
      reservationDate,
    );
    try {
      const reservation = await this.prisma.reservation.update({
        where: { id },
        data: { tableId, reservationDate },
        include: reservationResponseInclude,
      });
      return this.toResponse(reservation);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException("Update failed.");
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOwned(id, userId);
    if (existing.isCancelled) {
      throw new BadRequestException(
        "Cancelled reservations cannot be modified.",
      );
    }
    assertReservationCanBeCancelled(existing.reservationDate);
    await this.prisma.reservation.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledByUserId: userId,
        cancellationReason: "Cancelled by the user.",
      },
    });
  }

  private async findTable(officeId: string, number: number) {
    const office = await this.prisma.office.findFirst({
      where: { id: officeId, isActive: true },
      select: { id: true },
    });
    if (!office) throw new NotFoundException("Office not found.");
    const table = await this.prisma.table.findUnique({
      where: { officeId_number: { officeId, number } },
    });
    if (!table) throw new NotFoundException("Table not found.");
    return table;
  }
  private async findOwned(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: { include: { office: true } } },
    });
    if (!reservation) throw new NotFoundException("Reservation not found.");
    if (reservation.userId !== userId)
      throw new ForbiddenException(
        "You do not have permission to modify this reservation.",
      );
    return reservation;
  }
  private handleConflict(error: unknown) {
    if (this.isUniqueConstraintError(error)) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target ?? "");
      if (
        target.includes("userId") ||
        target.includes("active_user_date")
      )
        throw new ConflictException(
          "You can create only one reservation per day.",
        );
      throw new ConflictException(
        "The selected table is already reserved for this date.",
      );
    }
  }

  private async assertReservationAllowed(
    userId: string,
    tableId: number,
    reservationDate: Date,
  ) {
    const [restriction, userAssignment, tableAssignment, adminReservation] =
      await Promise.all([
      this.prisma.userRestriction.findFirst({
        where: {
          userId,
          revokedAt: null,
          startsOn: { lte: reservationDate },
          endsOn: { gte: reservationDate },
        },
      }),
      this.prisma.tableAssignment.findFirst({
        where: {
          userId,
          revokedAt: null,
          startsOn: { lte: reservationDate },
          OR: [{ endsOn: null }, { endsOn: { gte: reservationDate } }],
        },
      }),
      this.prisma.tableAssignment.findFirst({
        where: {
          tableId,
          revokedAt: null,
          startsOn: { lte: reservationDate },
          OR: [{ endsOn: null }, { endsOn: { gte: reservationDate } }],
        },
      }),
      this.prisma.reservation.findFirst({
        where: {
          userId,
          reservationDate,
          isCancelled: false,
          createdByAdminId: { not: null },
        },
      }),
    ]);
    if (restriction) {
      throw new ForbiddenException(
        restriction.reason
          ? `You cannot make reservations during this period. Reason: ${restriction.reason}`
          : "You cannot make reservations during this restricted period.",
      );
    }
    if (userAssignment && !adminReservation) {
      throw new ConflictException(
        "You already have an assigned table for this date.",
      );
    }
    if (tableAssignment) {
      const assignmentOwnerOverride =
        tableAssignment.userId === userId
          ? adminReservation
          : await this.prisma.reservation.findFirst({
              where: {
                userId: tableAssignment.userId,
                reservationDate,
                isCancelled: false,
                createdByAdminId: { not: null },
              },
            });
      if (assignmentOwnerOverride) return;
      throw new ConflictException(
        "The selected table is assigned to another user for this date.",
      );
    }
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
  private toResponse(reservation: ReservationResponseRecord) {
    return {
      id: reservation.id,
      reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
      tableNumber: reservation.table.number,
      office: {
        id: reservation.table.office.id,
        name: reservation.table.office.name,
        city: reservation.table.office.city,
      },
      equipments: reservation.table.equipments.map((item) => ({
        id: item.equipment.id,
        code: item.equipment.code,
        name: item.equipment.name,
      })),
    };
  }
}
