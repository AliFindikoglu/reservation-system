import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  formatDateOnly,
  getTodayInBusinessTimeZone,
  parseDateOnly,
} from "../reservations/reservation-date";
import {
  AdminReservationDto,
  CancelAdminReservationDto,
  UpdateAdminReservationDto,
} from "./dto/admin-reservation.dto";
import { UpdateUserRoleDto, UpdateUserStatusDto } from "./dto/admin-user.dto";
import {
  CreateRestrictionDto,
  RevokeRestrictionDto,
  UpdateRestrictionDto,
} from "./dto/restriction.dto";
import {
  CreateTableAssignmentDto,
  RevokeAssignmentDto,
  UpdateAssignmentEndDateDto,
} from "./dto/table-assignment.dto";
import { UpdateTableEquipmentsDto } from "./dto/update-table-equipments.dto";
import { CreateEquipmentDto } from "./dto/create-equipment.dto";

type Tx = Prisma.TransactionClient;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  findUsers(includeInactive = true) {
    return this.prisma.user.findMany({
      where: includeInactive ? undefined : { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { fullName: "asc" },
    });
  }

  async updateUserStatus(
    adminUserId: string,
    userId: string,
    dto: UpdateUserStatusDto,
  ) {
    const user = await this.findUser(userId);
    if (user.isActive === dto.isActive) {
      throw new ConflictException(
        dto.isActive
          ? "This user account is already active."
          : "This user account is already inactive.",
      );
    }
    const today = new Date(`${getTodayInBusinessTimeZone()}T00:00:00.000Z`);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(730031)`);
      if (!dto.isActive && user.role === UserRole.ADMIN) {
        const otherAdminCount = await tx.user.count({
          where: {
            id: { not: userId },
            role: UserRole.ADMIN,
            isActive: true,
          },
        });
        if (otherAdminCount === 0) {
          throw new ConflictException(
            "The last active administrator cannot be deactivated or have the administrator role removed.",
          );
        }
      }
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isActive: dto.isActive },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });

      if (!dto.isActive) {
        await tx.reservation.updateMany({
          where: {
            userId,
            isCancelled: false,
            reservationDate: { gte: today },
          },
          data: {
            isCancelled: true,
            cancelledAt: new Date(),
            cancelledByUserId: adminUserId,
            cancellationReason: "The user account was deactivated.",
          },
        });
        await tx.tableAssignment.updateMany({
          where: {
            userId,
            revokedAt: null,
            OR: [{ endsOn: null }, { endsOn: { gte: today } }],
          },
          data: {
            revokedAt: new Date(),
            revokedByAdminId: adminUserId,
            revocationReason: "The user account was deactivated.",
          },
        });
      }

      await this.createNotification(tx, {
        userId,
        type: dto.isActive ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
        title: dto.isActive ? "Account activated" : "Account deactivated",
        message: dto.isActive
          ? "Your account has been activated by an administrator."
          : "Your account has been deactivated by an administrator.",
        relatedEntityType: "User",
        relatedEntityId: userId,
      });
      await this.createAudit(tx, adminUserId, {
        action: dto.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
        targetType: "User",
        targetId: userId,
        oldValue: { isActive: user.isActive },
        newValue: { isActive: dto.isActive },
      });
      return updated;
    });
  }

  async updateUserRole(
    adminUserId: string,
    userId: string,
    dto: UpdateUserRoleDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(730031)`);
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException("User not found.");
      if (user.role === dto.role) {
        throw new ConflictException("This user already has the selected role.");
      }
      if (user.role === UserRole.ADMIN && dto.role === UserRole.USER) {
        const otherAdminCount = await tx.user.count({
          where: {
            id: { not: userId },
            role: UserRole.ADMIN,
            isActive: true,
          },
        });
        if (otherAdminCount === 0) {
          throw new ConflictException(
            "The last active administrator cannot be deactivated or have the administrator role removed.",
          );
        }
      }
      const updated = await tx.user.update({
        where: { id: userId },
        data: { role: dto.role },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });
      await this.createAudit(tx, adminUserId, {
        action: "UPDATE_USER_ROLE",
        targetType: "User",
        targetId: userId,
        oldValue: { role: user.role },
        newValue: { role: dto.role },
      });
      await this.createNotification(tx, {
        userId,
        type: "USER_ROLE_UPDATED",
        title: "Account role updated",
        message: `Your account role was updated to ${dto.role} by an administrator.`,
        relatedEntityType: "User",
        relatedEntityId: userId,
      });
      return updated;
    });
  }

  findReservations(includeCancelled = true) {
    return this.prisma.reservation.findMany({
      where: includeCancelled ? undefined : { isCancelled: false },
      include: {
        table: { select: { id: true, number: true, code: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ reservationDate: "desc" }, { createdAt: "desc" }],
    });
  }

  async previewReservation(dto: AdminReservationDto) {
    const date = parseDateOnly(dto.reservationDate, "reservation date");
    const user = await this.assertUserCanReceiveBooking(dto.userId, date);
    const table = await this.findTable(dto.tableNumber);
    const exact = await this.prisma.reservation.findFirst({
      where: {
        userId: user.id,
        tableId: table.id,
        reservationDate: date,
        isCancelled: false,
      },
    });
    if (exact) {
      throw new ConflictException("This reservation already exists.");
    }

    const [userReservation, tableReservation, userAssignment, tableAssignment] =
      await Promise.all([
        this.prisma.reservation.findFirst({
          where: { userId: user.id, reservationDate: date, isCancelled: false },
          include: { table: true, user: true },
        }),
        this.prisma.reservation.findFirst({
          where: { tableId: table.id, reservationDate: date, isCancelled: false },
          include: { table: true, user: true },
        }),
        this.findAssignmentForDate(this.prisma, { userId: user.id, date }),
        this.findAssignmentForDate(this.prisma, { tableId: table.id, date }),
      ]);

    if (
      userAssignment?.tableId === table.id &&
      userAssignment.userId === user.id
    ) {
      throw new ConflictException(
        "This user is already assigned to this table for the selected date.",
      );
    }

    const conflicts = this.uniqueById([
      userReservation,
      tableReservation,
      userAssignment,
      tableAssignment,
    ]);
    return {
      requiresConfirmation: conflicts.length > 0,
      target: {
        user: { id: user.id, fullName: user.fullName, email: user.email },
        table: { id: table.id, number: table.number, code: table.code },
        reservationDate: dto.reservationDate,
      },
      conflicts: conflicts.map((conflict) =>
        "reservationDate" in conflict
          ? this.reservationConflictResponse(conflict)
          : this.assignmentConflictResponse(conflict),
      ),
    };
  }

  async createReservation(adminUserId: string, dto: AdminReservationDto) {
    const preview = await this.previewReservation(dto);
    if (preview.requiresConfirmation && !dto.confirmOverride) {
      throw new ConflictException(
        "This reservation affects existing records. Please review and confirm the override.",
      );
    }
    const date = parseDateOnly(dto.reservationDate, "reservation date");
    const table = await this.findTable(dto.tableNumber);

    try {
      return await this.prisma.$transaction(async (tx) => {
      const affected = await tx.reservation.findMany({
        where: {
          isCancelled: false,
          reservationDate: date,
          OR: [{ userId: dto.userId }, { tableId: table.id }],
        },
        include: { table: true, user: true },
      });
      const assignmentConflicts = this.uniqueById([
        await this.findAssignmentForDate(tx, {
          userId: dto.userId,
          date,
        }),
        await this.findAssignmentForDate(tx, { tableId: table.id, date }),
      ]);
      const now = new Date();
      if (affected.length) {
        await tx.reservation.updateMany({
          where: { id: { in: affected.map((item) => item.id) } },
          data: {
            isCancelled: true,
            cancelledAt: now,
            cancelledByUserId: adminUserId,
            cancellationReason: dto.reason?.trim() || "Overridden by an administrator.",
          },
        });
      }

      if (dto.replacementTableNumber !== undefined) {
        const displacedReservation = affected.find(
          (item) => item.tableId === table.id && item.userId !== dto.userId,
        );
        const displacedAssignment = assignmentConflicts.find(
          (item) => item.tableId === table.id && item.userId !== dto.userId,
        );
        const displacedUserId =
          displacedReservation?.userId ?? displacedAssignment?.userId;
        if (displacedUserId) {
          await this.createReplacementReservation(
            tx,
            adminUserId,
            displacedUserId,
            date,
            dto.replacementTableNumber,
          );
        }
      }

      const reservation = await tx.reservation.create({
        data: {
          userId: dto.userId,
          tableId: table.id,
          reservationDate: date,
          createdByAdminId: adminUserId,
        },
        include: { table: true, user: true },
      });

      for (const item of affected.filter((item) => item.userId !== dto.userId)) {
        await this.createNotification(tx, {
          userId: item.userId,
          type: "RESERVATION_OVERRIDDEN",
          title: "Reservation changed",
          message: dto.reason?.trim()
            ? `Your reservation was changed by an administrator. Reason: ${dto.reason.trim()}`
            : "Your reservation was changed by an administrator.",
          relatedEntityType: "Reservation",
          relatedEntityId: item.id,
        });
      }
      for (const assignment of assignmentConflicts) {
        await this.createNotification(tx, {
          userId: assignment.userId,
          type: "TABLE_ASSIGNMENT_OVERRIDDEN",
          title: "Table assignment temporarily unavailable",
          message: dto.reason?.trim()
            ? `Your table assignment is unavailable on ${dto.reservationDate}. Reason: ${dto.reason.trim()}`
            : `Your table assignment is unavailable on ${dto.reservationDate} because of an administrator reservation.`,
          relatedEntityType: "TableAssignment",
          relatedEntityId: assignment.id,
        });
      }
      await this.createNotification(tx, {
        userId: dto.userId,
        type: "ADMIN_RESERVATION_CREATED",
        title: "Reservation created",
        message: `An administrator reserved table ${table.code} for ${dto.reservationDate}.`,
        relatedEntityType: "Reservation",
        relatedEntityId: reservation.id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "CREATE_ADMIN_RESERVATION",
        targetType: "Reservation",
        targetId: reservation.id,
        newValue: this.reservationAuditValue(reservation),
        reason: dto.reason?.trim(),
      });
        return this.reservationResponse(reservation);
      });
    } catch (error) {
      if (this.isDatabaseConflict(error)) {
        throw new ConflictException(
          "This reservation already exists or conflicts with another active reservation.",
        );
      }
      throw error;
    }
  }

  async updateReservation(
    adminUserId: string,
    id: string,
    dto: UpdateAdminReservationDto,
  ) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true, user: true },
    });
    if (!existing) throw new NotFoundException("Reservation not found.");
    if (existing.isCancelled) {
      throw new BadRequestException("Cancelled reservations cannot be modified.");
    }
    if (
      dto.userId === undefined &&
      dto.tableNumber === undefined &&
      dto.reservationDate === undefined
    ) {
      throw new BadRequestException(
        "Please provide a user, reservation date, or table number to update.",
      );
    }
    const command: AdminReservationDto = {
      userId: dto.userId ?? existing.userId,
      tableNumber: dto.tableNumber ?? existing.table.number,
      reservationDate: dto.reservationDate ?? formatDateOnly(existing.reservationDate),
      confirmOverride: dto.confirmOverride,
      reason: dto.reason,
    };
    const date = parseDateOnly(command.reservationDate, "reservation date");
    await this.assertUserCanReceiveBooking(command.userId, date);
    const table = await this.findTable(command.tableNumber);
    const [conflicts, userAssignment, tableAssignment] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          id: { not: id },
          isCancelled: false,
          reservationDate: date,
          OR: [{ userId: command.userId }, { tableId: table.id }],
        },
      }),
      this.findAssignmentForDate(this.prisma, {
        userId: command.userId,
        date,
      }),
      this.findAssignmentForDate(this.prisma, { tableId: table.id, date }),
    ]);
    if (
      (conflicts.length || userAssignment || tableAssignment) &&
      !command.confirmOverride
    ) {
      throw new ConflictException(
        "This update affects existing records. Please review and confirm the override.",
      );
    }
    return this.prisma.$transaction(async (tx) => {
      if (conflicts.length) {
        await tx.reservation.updateMany({
          where: { id: { in: conflicts.map((item) => item.id) } },
          data: {
            isCancelled: true,
            cancelledAt: new Date(),
            cancelledByUserId: adminUserId,
            cancellationReason: command.reason?.trim() || "Overridden by an administrator.",
          },
        });
      }
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          userId: command.userId,
          tableId: table.id,
          reservationDate: date,
          createdByAdminId: existing.createdByAdminId ?? adminUserId,
        },
        include: { table: true, user: true },
      });
      for (const assignment of this.uniqueById([
        userAssignment,
        tableAssignment,
      ])) {
        await this.createNotification(tx, {
          userId: assignment.userId,
          type: "TABLE_ASSIGNMENT_OVERRIDDEN",
          title: "Table assignment temporarily unavailable",
          message: command.reason?.trim()
            ? `Your table assignment is unavailable on ${command.reservationDate}. Reason: ${command.reason.trim()}`
            : `Your table assignment is unavailable on ${command.reservationDate} because of an administrator reservation.`,
          relatedEntityType: "TableAssignment",
          relatedEntityId: assignment.id,
        });
      }
      await this.createNotification(tx, {
        userId: updated.userId,
        type: "RESERVATION_UPDATED",
        title: "Reservation updated",
        message: command.reason?.trim()
          ? `Your reservation was updated by an administrator. Reason: ${command.reason.trim()}`
          : "Your reservation was updated by an administrator.",
        relatedEntityType: "Reservation",
        relatedEntityId: id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "UPDATE_RESERVATION",
        targetType: "Reservation",
        targetId: id,
        oldValue: this.reservationAuditValue(existing),
        newValue: this.reservationAuditValue(updated),
        reason: command.reason?.trim(),
      });
      return this.reservationResponse(updated);
    });
  }

  async previewReservationUpdate(id: string, dto: UpdateAdminReservationDto) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true, user: true },
    });
    if (!existing) throw new NotFoundException("Reservation not found.");
    if (existing.isCancelled) {
      throw new BadRequestException("Cancelled reservations cannot be modified.");
    }
    const userId = dto.userId ?? existing.userId;
    const tableNumber = dto.tableNumber ?? existing.table.number;
    const reservationDate =
      dto.reservationDate ?? formatDateOnly(existing.reservationDate);
    const date = parseDateOnly(reservationDate, "reservation date");
    const user = await this.assertUserCanReceiveBooking(userId, date);
    const table = await this.findTable(tableNumber);
    const [reservations, userAssignment, tableAssignment] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          id: { not: id },
          isCancelled: false,
          reservationDate: date,
          OR: [{ userId }, { tableId: table.id }],
        },
        include: { table: true, user: true },
      }),
      this.findAssignmentForDate(this.prisma, { userId, date }),
      this.findAssignmentForDate(this.prisma, { tableId: table.id, date }),
    ]);
    const assignments = this.uniqueById([userAssignment, tableAssignment]);
    return {
      requiresConfirmation: reservations.length > 0 || assignments.length > 0,
      target: {
        user: { id: user.id, fullName: user.fullName, email: user.email },
        table: { id: table.id, number: table.number, code: table.code },
        reservationDate,
      },
      conflicts: {
        reservations: reservations.map((item) =>
          this.reservationConflictResponse(item),
        ),
        assignments: assignments.map((item) =>
          this.assignmentConflictResponse(item),
        ),
      },
    };
  }

  async cancelReservation(
    adminUserId: string,
    id: string,
    dto: CancelAdminReservationDto,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true, user: true },
    });
    if (!reservation) throw new NotFoundException("Reservation not found.");
    if (reservation.isCancelled) {
      throw new ConflictException("This reservation is already cancelled.");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: {
          isCancelled: true,
          cancelledAt: new Date(),
          cancelledByUserId: adminUserId,
          cancellationReason: dto.reason?.trim() || "Cancelled by an administrator.",
        },
      });
      await this.createNotification(tx, {
        userId: reservation.userId,
        type: "RESERVATION_CANCELLED",
        title: "Reservation cancelled",
        message: dto.reason?.trim()
          ? `Your reservation was cancelled by an administrator. Reason: ${dto.reason.trim()}`
          : "Your reservation was cancelled by an administrator.",
        relatedEntityType: "Reservation",
        relatedEntityId: id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "CANCEL_RESERVATION",
        targetType: "Reservation",
        targetId: id,
        oldValue: this.reservationAuditValue(reservation),
        newValue: { isCancelled: true },
        reason: dto.reason?.trim(),
      });
    });
    return { message: "The reservation has been cancelled successfully." };
  }

  findAssignments(includeRevoked = true) {
    return this.prisma.tableAssignment.findMany({
      where: includeRevoked ? undefined : { revokedAt: null },
      include: {
        table: { select: { id: true, number: true, code: true } },
        user: { select: { id: true, fullName: true, email: true, isActive: true } },
      },
      orderBy: [{ startsOn: "desc" }, { createdAt: "desc" }],
    });
  }

  async previewAssignment(dto: CreateTableAssignmentDto) {
    const { startsOn, endsOn } = this.parseRange(dto.startsOn, dto.endsOn);
    const user = await this.assertUserActive(dto.userId);
    await this.assertNoRestrictionOverlap(user.id, startsOn, endsOn);
    const table = await this.findTable(dto.tableNumber);
    const conflicts = await this.getAssignmentImpact(
      user.id,
      table.id,
      startsOn,
      endsOn,
    );
    const exact = conflicts.assignments.find(
      (item) =>
        item.userId === user.id &&
        item.tableId === table.id &&
        item.startsOn.getTime() === startsOn.getTime() &&
        this.sameNullableDate(item.endsOn, endsOn),
    );
    if (exact) {
      throw new ConflictException("This table assignment already exists.");
    }
    return {
      requiresConfirmation:
        conflicts.assignments.length > 0 || conflicts.reservations.length > 0,
      target: {
        user: { id: user.id, fullName: user.fullName, email: user.email },
        table: { id: table.id, number: table.number, code: table.code },
        startsOn: dto.startsOn,
        endsOn: dto.endsOn ?? null,
      },
      conflicts: {
        assignments: conflicts.assignments.map((item) =>
          this.assignmentConflictResponse(item),
        ),
        reservations: conflicts.reservations.map((item) =>
          this.reservationConflictResponse(item),
        ),
      },
    };
  }

  async createAssignment(adminUserId: string, dto: CreateTableAssignmentDto) {
    const preview = await this.previewAssignment(dto);
    if (preview.requiresConfirmation && !dto.confirmOverride) {
      throw new ConflictException(
        "This user or table already has records within the selected date range. Please review and confirm the override.",
      );
    }
    const { startsOn, endsOn } = this.parseRange(dto.startsOn, dto.endsOn);
    const table = await this.findTable(dto.tableNumber);
    try {
      return await this.prisma.$transaction(async (tx) => {
      const impact = await this.getAssignmentImpact(
        dto.userId,
        table.id,
        startsOn,
        endsOn,
        tx,
      );
      const now = new Date();
      if (impact.assignments.length) {
        await tx.tableAssignment.updateMany({
          where: { id: { in: impact.assignments.map((item) => item.id) } },
          data: {
            revokedAt: now,
            revokedByAdminId: adminUserId,
            revocationReason: dto.reason?.trim() || "Replaced by another table assignment.",
          },
        });
      }

      const userReservations = impact.reservations.filter(
        (reservation) => reservation.createdByAdminId === null,
      );
      if (userReservations.length) {
        await tx.reservation.updateMany({
          where: { id: { in: userReservations.map((item) => item.id) } },
          data: {
            isCancelled: true,
            cancelledAt: now,
            cancelledByUserId: adminUserId,
            cancellationReason: dto.reason?.trim() || "Replaced by a table assignment.",
          },
        });
      }

      const assignment = await tx.tableAssignment.create({
        data: {
          userId: dto.userId,
          tableId: table.id,
          startsOn,
          endsOn,
          createdByAdminId: adminUserId,
        },
        include: { table: true, user: true },
      });

      for (const oldAssignment of impact.assignments) {
        if (oldAssignment.userId !== dto.userId) {
          await this.createNotification(tx, {
            userId: oldAssignment.userId,
            type: "TABLE_ASSIGNMENT_REVOKED",
            title: "Table assignment ended",
            message: "Your table assignment was ended by an administrator.",
            relatedEntityType: "TableAssignment",
            relatedEntityId: oldAssignment.id,
          });
        }
      }
      for (const reservation of userReservations) {
        if (reservation.userId !== dto.userId) {
          await this.createNotification(tx, {
            userId: reservation.userId,
            type: "RESERVATION_CANCELLED",
            title: "Reservation cancelled",
            message: "Your reservation was cancelled because an administrator assigned the table.",
            relatedEntityType: "Reservation",
            relatedEntityId: reservation.id,
          });
        }
      }
      await this.createNotification(tx, {
        userId: dto.userId,
        type: "TABLE_ASSIGNED",
        title: "Table assigned",
        message: `Table ${table.code} has been assigned to you from ${dto.startsOn}${dto.endsOn ? ` through ${dto.endsOn}` : " without an end date"}.`,
        relatedEntityType: "TableAssignment",
        relatedEntityId: assignment.id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "CREATE_TABLE_ASSIGNMENT",
        targetType: "TableAssignment",
        targetId: assignment.id,
        newValue: {
          userId: dto.userId,
          tableId: table.id,
          startsOn: dto.startsOn,
          endsOn: dto.endsOn ?? null,
        },
        reason: dto.reason?.trim(),
      });
        return this.assignmentResponse(assignment);
      });
    } catch (error) {
      if (this.isDatabaseConflict(error)) {
        throw new ConflictException(
          "This user or table already has an assignment within the selected date range.",
        );
      }
      throw error;
    }
  }

  async updateAssignmentEndDate(
    adminUserId: string,
    id: string,
    dto: UpdateAssignmentEndDateDto,
  ) {
    const assignment = await this.prisma.tableAssignment.findUnique({
      where: { id },
      include: { table: true, user: true },
    });
    if (!assignment) throw new NotFoundException("Table assignment not found.");
    if (assignment.revokedAt) {
      throw new ConflictException("Revoked table assignments cannot be modified.");
    }
    const endsOn =
      dto.endsOn === null || dto.endsOn === undefined
        ? null
        : parseDateOnly(dto.endsOn, "end date");
    if (endsOn && endsOn < assignment.startsOn) {
      throw new BadRequestException("The end date cannot be before the start date.");
    }
    if (this.sameNullableDate(assignment.endsOn, endsOn)) {
      throw new ConflictException("This table assignment already has the selected end date.");
    }
    const extendsRange =
      assignment.endsOn !== null &&
      (endsOn === null || endsOn > assignment.endsOn);
    let impact: Awaited<ReturnType<AdminService["getAssignmentImpact"]>> = {
      assignments: [],
      reservations: [],
    };
    if (extendsRange && assignment.endsOn) {
      const extensionStartsOn = new Date(assignment.endsOn);
      extensionStartsOn.setUTCDate(extensionStartsOn.getUTCDate() + 1);
      await this.assertNoRestrictionOverlap(
        assignment.userId,
        extensionStartsOn,
        endsOn,
      );
      impact = await this.getAssignmentImpact(
        assignment.userId,
        assignment.tableId,
        extensionStartsOn,
        endsOn,
        this.prisma,
        assignment.id,
      );
    }
    if (
      (impact.assignments.length || impact.reservations.length) &&
      !dto.confirmOverride
    ) {
      throw new ConflictException(
        "The new end date affects existing records. Please review and confirm the override.",
      );
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        if (impact.assignments.length) {
          await tx.tableAssignment.updateMany({
            where: { id: { in: impact.assignments.map((item) => item.id) } },
            data: {
              revokedAt: now,
              revokedByAdminId: adminUserId,
              revocationReason: dto.reason?.trim() || "Replaced by an extended table assignment.",
            },
          });
        }
        const normalReservations = impact.reservations.filter(
          (item) => item.createdByAdminId === null,
        );
        if (normalReservations.length) {
          await tx.reservation.updateMany({
            where: { id: { in: normalReservations.map((item) => item.id) } },
            data: {
              isCancelled: true,
              cancelledAt: now,
              cancelledByUserId: adminUserId,
              cancellationReason: dto.reason?.trim() || "Replaced by an extended table assignment.",
            },
          });
        }
        const updated = await tx.tableAssignment.update({
          where: { id },
          data: { endsOn },
          include: { table: true, user: true },
        });
        await this.createNotification(tx, {
          userId: assignment.userId,
          type: "TABLE_ASSIGNMENT_UPDATED",
          title: "Table assignment updated",
          message: `The end date of your table assignment was updated to ${endsOn ? formatDateOnly(endsOn) : "no end date"}.`,
          relatedEntityType: "TableAssignment",
          relatedEntityId: id,
        });
        await this.createAudit(tx, adminUserId, {
          action: "UPDATE_ASSIGNMENT_END_DATE",
          targetType: "TableAssignment",
          targetId: id,
          oldValue: {
            endsOn: assignment.endsOn
              ? formatDateOnly(assignment.endsOn)
              : null,
          },
          newValue: { endsOn: endsOn ? formatDateOnly(endsOn) : null },
          reason: dto.reason?.trim(),
        });
        return this.assignmentResponse(updated);
      });
    } catch (error) {
      if (this.isDatabaseConflict(error)) {
        throw new ConflictException(
          "The new end date conflicts with another table assignment.",
        );
      }
      throw error;
    }
  }

  async revokeAssignment(
    adminUserId: string,
    id: string,
    dto: RevokeAssignmentDto,
  ) {
    const assignment = await this.prisma.tableAssignment.findUnique({
      where: { id },
      include: { table: true },
    });
    if (!assignment) throw new NotFoundException("Table assignment not found.");
    if (assignment.revokedAt) {
      throw new ConflictException("This table assignment is already revoked.");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.tableAssignment.update({
        where: { id },
        data: {
          revokedAt: new Date(),
          revokedByAdminId: adminUserId,
          revocationReason: dto.reason?.trim() || null,
        },
      });
      await this.createNotification(tx, {
        userId: assignment.userId,
        type: "TABLE_ASSIGNMENT_REVOKED",
        title: "Table assignment ended",
        message: dto.reason?.trim()
          ? `Your table assignment was ended by an administrator. Reason: ${dto.reason.trim()}`
          : "Your table assignment was ended by an administrator.",
        relatedEntityType: "TableAssignment",
        relatedEntityId: id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "REVOKE_TABLE_ASSIGNMENT",
        targetType: "TableAssignment",
        targetId: id,
        oldValue: { revokedAt: null },
        newValue: { revokedAt: new Date().toISOString() },
        reason: dto.reason?.trim(),
      });
    });
    return { message: "The table assignment has been revoked successfully." };
  }

  findRestrictions(includeRevoked = true) {
    return this.prisma.userRestriction.findMany({
      where: includeRevoked ? undefined : { revokedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true, isActive: true } },
      },
      orderBy: [{ startsOn: "desc" }, { createdAt: "desc" }],
    });
  }

  async previewRestriction(dto: CreateRestrictionDto) {
    const { startsOn, endsOn } = this.parseRequiredRange(dto.startsOn, dto.endsOn);
    const user = await this.assertUserActive(dto.userId);
    const activeRestriction = await this.prisma.userRestriction.findFirst({
      where: {
        userId: user.id,
        revokedAt: null,
        startsOn: { lte: endsOn },
        endsOn: { gte: startsOn },
      },
    });
    if (activeRestriction) {
      throw new ConflictException("This user already has an active restriction.");
    }
    const impact = await this.getRestrictionImpact(user.id, startsOn, endsOn);
    return {
      requiresConfirmation:
        impact.reservations.length > 0 || impact.assignments.length > 0,
      target: {
        user: { id: user.id, fullName: user.fullName, email: user.email },
        startsOn: dto.startsOn,
        endsOn: dto.endsOn,
      },
      impact: {
        reservations: impact.reservations.map((item) => ({
          id: item.id,
          reservationDate: formatDateOnly(item.reservationDate),
          table: {
            id: item.table.id,
            number: item.table.number,
            code: item.table.code,
          },
          source: item.createdByAdminId ? "admin" : "user",
        })),
        assignments: impact.assignments.map((item) => ({
          id: item.id,
          startsOn: formatDateOnly(item.startsOn),
          endsOn: item.endsOn ? formatDateOnly(item.endsOn) : null,
          table: {
            id: item.table.id,
            number: item.table.number,
            code: item.table.code,
          },
        })),
      },
    };
  }

  async createRestriction(adminUserId: string, dto: CreateRestrictionDto) {
    const preview = await this.previewRestriction(dto);
    if (preview.requiresConfirmation && !dto.confirmImpact) {
      throw new ConflictException(
        "This restriction will cancel reservations or table assignments. Please review and confirm the impact.",
      );
    }
    const { startsOn, endsOn } = this.parseRequiredRange(dto.startsOn, dto.endsOn);
    return this.prisma.$transaction(async (tx) => {
      const impact = await this.getRestrictionImpact(
        dto.userId,
        startsOn,
        endsOn,
        tx,
      );
      const now = new Date();
      if (impact.reservations.length) {
        await tx.reservation.updateMany({
          where: { id: { in: impact.reservations.map((item) => item.id) } },
          data: {
            isCancelled: true,
            cancelledAt: now,
            cancelledByUserId: adminUserId,
            cancellationReason: dto.reason?.trim() || "Cancelled because of a user restriction.",
          },
        });
      }
      if (impact.assignments.length) {
        await tx.tableAssignment.updateMany({
          where: { id: { in: impact.assignments.map((item) => item.id) } },
          data: {
            revokedAt: now,
            revokedByAdminId: adminUserId,
            revocationReason: dto.reason?.trim() || "Revoked because of a user restriction.",
          },
        });
      }
      const restriction = await tx.userRestriction.create({
        data: {
          userId: dto.userId,
          startsOn,
          endsOn,
          reason: dto.reason?.trim() || null,
          createdByAdminId: adminUserId,
        },
      });
      await this.createNotification(tx, {
        userId: dto.userId,
        type: "RESTRICTION_CREATED",
        title: "Reservation access restricted",
        message: dto.reason?.trim()
          ? `You cannot make reservations from ${dto.startsOn} through ${dto.endsOn}. Reason: ${dto.reason.trim()}`
          : `You cannot make reservations from ${dto.startsOn} through ${dto.endsOn}.`,
        relatedEntityType: "UserRestriction",
        relatedEntityId: restriction.id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "CREATE_USER_RESTRICTION",
        targetType: "UserRestriction",
        targetId: restriction.id,
        newValue: {
          userId: dto.userId,
          startsOn: dto.startsOn,
          endsOn: dto.endsOn,
        },
        reason: dto.reason?.trim(),
      });
      return restriction;
    });
  }

  async updateRestriction(
    adminUserId: string,
    id: string,
    dto: UpdateRestrictionDto,
  ) {
    const existing = await this.prisma.userRestriction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("User restriction not found.");
    if (existing.revokedAt) {
      throw new ConflictException("Revoked restrictions cannot be modified.");
    }
    if (
      dto.startsOn === undefined &&
      dto.endsOn === undefined &&
      dto.reason === undefined
    ) {
      throw new BadRequestException(
        "Please provide a start date, end date, or reason to update.",
      );
    }
    const startsOn = dto.startsOn
      ? parseDateOnly(dto.startsOn, "start date")
      : existing.startsOn;
    const endsOn = dto.endsOn
      ? parseDateOnly(dto.endsOn, "end date")
      : existing.endsOn;
    if (endsOn < startsOn) {
      throw new BadRequestException("The end date cannot be before the start date.");
    }
    const impact = await this.getRestrictionImpact(
      existing.userId,
      startsOn,
      endsOn,
    );
    if (
      (impact.reservations.length || impact.assignments.length) &&
      !dto.confirmImpact
    ) {
      throw new ConflictException(
        "This restriction update affects reservations or assignments. Please review and confirm the impact.",
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      if (impact.reservations.length) {
        await tx.reservation.updateMany({
          where: { id: { in: impact.reservations.map((item) => item.id) } },
          data: {
            isCancelled: true,
            cancelledAt: now,
            cancelledByUserId: adminUserId,
            cancellationReason: dto.reason?.trim() || existing.reason || "Cancelled because of a user restriction.",
          },
        });
      }
      if (impact.assignments.length) {
        await tx.tableAssignment.updateMany({
          where: { id: { in: impact.assignments.map((item) => item.id) } },
          data: {
            revokedAt: now,
            revokedByAdminId: adminUserId,
            revocationReason: dto.reason?.trim() || existing.reason || "Revoked because of a user restriction.",
          },
        });
      }
      const updated = await tx.userRestriction.update({
        where: { id },
        data: {
          startsOn,
          endsOn,
          ...(dto.reason !== undefined ? { reason: dto.reason.trim() || null } : {}),
        },
      });
      await this.createNotification(tx, {
        userId: existing.userId,
        type: "RESTRICTION_UPDATED",
        title: "Reservation restriction updated",
        message: "Your reservation restriction was updated by an administrator.",
        relatedEntityType: "UserRestriction",
        relatedEntityId: id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "UPDATE_USER_RESTRICTION",
        targetType: "UserRestriction",
        targetId: id,
        oldValue: {
          startsOn: formatDateOnly(existing.startsOn),
          endsOn: formatDateOnly(existing.endsOn),
          reason: existing.reason,
        },
        newValue: {
          startsOn: formatDateOnly(startsOn),
          endsOn: formatDateOnly(endsOn),
          reason: updated.reason,
        },
      });
      return updated;
    });
  }

  async revokeRestriction(
    adminUserId: string,
    id: string,
    dto: RevokeRestrictionDto,
  ) {
    const restriction = await this.prisma.userRestriction.findUnique({ where: { id } });
    if (!restriction) throw new NotFoundException("User restriction not found.");
    if (restriction.revokedAt) {
      throw new ConflictException("This restriction is already revoked.");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.userRestriction.update({
        where: { id },
        data: { revokedAt: new Date(), revokedByAdminId: adminUserId },
      });
      await this.createNotification(tx, {
        userId: restriction.userId,
        type: "RESTRICTION_REVOKED",
        title: "Reservation restriction removed",
        message: dto.reason?.trim()
          ? `Your reservation restriction was removed. Reason: ${dto.reason.trim()}`
          : "Your reservation restriction was removed by an administrator.",
        relatedEntityType: "UserRestriction",
        relatedEntityId: id,
      });
      await this.createAudit(tx, adminUserId, {
        action: "REVOKE_USER_RESTRICTION",
        targetType: "UserRestriction",
        targetId: id,
        oldValue: { revokedAt: null },
        newValue: { revokedAt: new Date().toISOString() },
        reason: dto.reason?.trim(),
      });
    });
    return { message: "The user restriction has been revoked successfully." };
  }

  async updateTableEquipments(
    adminUserId: string,
    tableId: number,
    dto: UpdateTableEquipmentsDto,
  ) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      include: { equipments: { include: { equipment: true } } },
    });
    if (!table) throw new NotFoundException("Table not found.");
    const equipments = await this.prisma.equipment.findMany({
      where: { id: { in: dto.equipmentIds }, isActive: true },
    });
    if (equipments.length !== dto.equipmentIds.length) {
      throw new BadRequestException("One or more selected equipments are invalid.");
    }
    const monitorOptions = new Set(["MONITOR", "DUAL_MONITOR"]);
    if (equipments.filter((equipment) => monitorOptions.has(equipment.code)).length > 1) {
      throw new BadRequestException(
        "Please select either Monitor or Dual Monitor, not both.",
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.tableEquipment.deleteMany({ where: { tableId } });
      if (dto.equipmentIds.length) {
        await tx.tableEquipment.createMany({
          data: dto.equipmentIds.map((equipmentId) => ({
            tableId,
            equipmentId,
            assignedByAdminId: adminUserId,
          })),
        });
      }
      await this.createAudit(tx, adminUserId, {
        action: "UPDATE_TABLE_EQUIPMENTS",
        targetType: "Table",
        targetId: String(tableId),
        oldValue: { equipmentIds: table.equipments.map((item) => item.equipmentId) },
        newValue: { equipmentIds: dto.equipmentIds },
      });
      return tx.table.findUniqueOrThrow({
        where: { id: tableId },
        select: {
          id: true,
          number: true,
          code: true,
          equipments: {
            select: { equipment: { select: { id: true, code: true, name: true } } },
            orderBy: { equipment: { name: "asc" } },
          },
        },
      });
    }).then((updated) => ({
      message: "Table equipments have been updated successfully.",
      table: {
        id: updated.id,
        number: updated.number,
        code: updated.code,
        equipments: updated.equipments.map((item) => item.equipment),
      },
    }));
  }

  async createEquipment(adminUserId: string, dto: CreateEquipmentDto) {
    const data = {
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const equipment = await tx.equipment.create({ data });
        await this.createAudit(tx, adminUserId, {
          action: "CREATE_EQUIPMENT",
          targetType: "Equipment",
          targetId: equipment.id,
          newValue: data,
        });
        return equipment;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("An equipment type with this name or code already exists.");
      }
      throw error;
    }
  }

  findAuditLogs() {
    return this.prisma.adminAuditLog.findMany({
      include: {
        adminUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private async findUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  private async assertUserActive(id: string) {
    const user = await this.findUser(id);
    if (!user.isActive) {
      throw new ConflictException("This user account is inactive.");
    }
    return user;
  }

  private async assertUserCanReceiveBooking(userId: string, date: Date) {
    const user = await this.assertUserActive(userId);
    const restriction = await this.prisma.userRestriction.findFirst({
      where: {
        userId,
        revokedAt: null,
        startsOn: { lte: date },
        endsOn: { gte: date },
      },
    });
    if (restriction) {
      throw new ConflictException(
        "This user has an active restriction for the selected date. Remove the restriction before continuing.",
      );
    }
    return user;
  }

  private async assertNoRestrictionOverlap(
    userId: string,
    startsOn: Date,
    endsOn: Date | null,
  ) {
    const restriction = await this.prisma.userRestriction.findFirst({
      where: {
        userId,
        revokedAt: null,
        endsOn: { gte: startsOn },
        ...(endsOn ? { startsOn: { lte: endsOn } } : {}),
      },
    });
    if (restriction) {
      throw new ConflictException(
        "This user has a restriction within the selected date range. Remove the restriction before continuing.",
      );
    }
  }

  private async findTable(number: number) {
    const table = await this.prisma.table.findUnique({ where: { number } });
    if (!table) throw new NotFoundException("Table not found.");
    return table;
  }

  private parseRange(startsOnValue: string, endsOnValue?: string | null) {
    const startsOn = parseDateOnly(startsOnValue, "start date");
    const endsOn = endsOnValue
      ? parseDateOnly(endsOnValue, "end date")
      : null;
    if (endsOn && endsOn < startsOn) {
      throw new BadRequestException("The end date cannot be before the start date.");
    }
    return { startsOn, endsOn };
  }

  private parseRequiredRange(startsOnValue: string, endsOnValue: string) {
    const startsOn = parseDateOnly(startsOnValue, "start date");
    const endsOn = parseDateOnly(endsOnValue, "end date");
    if (endsOn < startsOn) {
      throw new BadRequestException("The end date cannot be before the start date.");
    }
    return { startsOn, endsOn };
  }

  private assignmentOverlapWhere(
    startsOn: Date,
    endsOn: Date | null,
  ): Prisma.TableAssignmentWhereInput {
    return {
      revokedAt: null,
      OR: [{ endsOn: null }, { endsOn: { gte: startsOn } }],
      ...(endsOn ? { startsOn: { lte: endsOn } } : {}),
    };
  }

  private reservationRangeWhere(
    startsOn: Date,
    endsOn: Date | null,
  ): Prisma.ReservationWhereInput {
    return {
      reservationDate: endsOn
        ? { gte: startsOn, lte: endsOn }
        : { gte: startsOn },
    };
  }

  private async getAssignmentImpact(
    userId: string,
    tableId: number,
    startsOn: Date,
    endsOn: Date | null,
    database: PrismaService | Tx = this.prisma,
    excludedAssignmentId?: string,
  ) {
    const [assignments, reservations] = await Promise.all([
      database.tableAssignment.findMany({
        where: {
          ...this.assignmentOverlapWhere(startsOn, endsOn),
          ...(excludedAssignmentId ? { id: { not: excludedAssignmentId } } : {}),
          OR: [
            { userId, ...this.assignmentOverlapWhere(startsOn, endsOn) },
            { tableId, ...this.assignmentOverlapWhere(startsOn, endsOn) },
          ],
        },
        include: { table: true, user: true },
      }),
      database.reservation.findMany({
        where: {
          isCancelled: false,
          ...this.reservationRangeWhere(startsOn, endsOn),
          OR: [{ userId }, { tableId }],
        },
        include: { table: true, user: true },
      }),
    ]);
    return { assignments, reservations };
  }

  private async getRestrictionImpact(
    userId: string,
    startsOn: Date,
    endsOn: Date,
    database: PrismaService | Tx = this.prisma,
  ) {
    const [reservations, assignments] = await Promise.all([
      database.reservation.findMany({
        where: {
          userId,
          isCancelled: false,
          reservationDate: { gte: startsOn, lte: endsOn },
        },
        include: { table: true },
      }),
      database.tableAssignment.findMany({
        where: {
          userId,
          ...this.assignmentOverlapWhere(startsOn, endsOn),
        },
        include: { table: true },
      }),
    ]);
    return { reservations, assignments };
  }

  private findAssignmentForDate(
    database: PrismaService | Tx,
    filter: { userId?: string; tableId?: number; date: Date },
  ) {
    return database.tableAssignment.findFirst({
      where: {
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.tableId ? { tableId: filter.tableId } : {}),
        revokedAt: null,
        startsOn: { lte: filter.date },
        OR: [{ endsOn: null }, { endsOn: { gte: filter.date } }],
      },
      include: { table: true, user: true },
    });
  }

  private async createReplacementReservation(
    tx: Tx,
    adminUserId: string,
    userId: string,
    date: Date,
    tableNumber: number,
  ) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) {
      throw new ConflictException("The displaced user account is inactive.");
    }
    const restriction = await tx.userRestriction.findFirst({
      where: {
        userId,
        revokedAt: null,
        startsOn: { lte: date },
        endsOn: { gte: date },
      },
    });
    if (restriction) {
      throw new ConflictException(
        "The displaced user has a restriction for the selected date.",
      );
    }
    const table = await tx.table.findUnique({ where: { number: tableNumber } });
    if (!table) throw new NotFoundException("Replacement table not found.");
    const [reservation, assignment] = await Promise.all([
      tx.reservation.findFirst({
        where: { tableId: table.id, reservationDate: date, isCancelled: false },
      }),
      this.findAssignmentForDate(tx, { tableId: table.id, date }),
    ]);
    if (reservation || assignment) {
      throw new ConflictException(
        "The selected replacement table is not available.",
      );
    }
    return tx.reservation.create({
      data: {
        userId,
        tableId: table.id,
        reservationDate: date,
        createdByAdminId: adminUserId,
      },
    });
  }

  private createNotification(
    tx: Tx,
    data: {
      userId: string;
      type: string;
      title: string;
      message: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
    },
  ) {
    return tx.notification.create({ data });
  }

  private createAudit(
    tx: Tx,
    adminUserId: string,
    data: {
      action: string;
      targetType: string;
      targetId: string;
      oldValue?: Prisma.InputJsonValue;
      newValue?: Prisma.InputJsonValue;
      reason?: string;
    },
  ) {
    return tx.adminAuditLog.create({
      data: {
        adminUserId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        reason: data.reason,
      },
    });
  }

  private reservationAuditValue(reservation: {
    userId: string;
    tableId: number;
    reservationDate: Date;
    isCancelled: boolean;
  }): Prisma.InputJsonValue {
    return {
      userId: reservation.userId,
      tableId: reservation.tableId,
      reservationDate: formatDateOnly(reservation.reservationDate),
      isCancelled: reservation.isCancelled,
    };
  }

  private reservationResponse(reservation: {
    id: string;
    reservationDate: Date;
    table: { number: number; code: string };
    user: { id: string; fullName: string; email: string };
  }) {
    return {
      id: reservation.id,
      reservationDate: formatDateOnly(reservation.reservationDate),
      table: reservation.table,
      user: reservation.user,
      source: "admin",
    };
  }

  private assignmentResponse(assignment: {
    id: string;
    startsOn: Date;
    endsOn: Date | null;
    table: { number: number; code: string };
    user: { id: string; fullName: string; email: string };
  }) {
    return {
      id: assignment.id,
      startsOn: formatDateOnly(assignment.startsOn),
      endsOn: assignment.endsOn ? formatDateOnly(assignment.endsOn) : null,
      table: assignment.table,
      user: assignment.user,
    };
  }

  private reservationConflictResponse(reservation: {
    id: string;
    userId: string;
    reservationDate: Date;
    createdByAdminId: string | null;
    table: { id: number; number: number; code: string };
    user: { id: string; fullName: string; email: string };
  }) {
    return {
      type: "reservation",
      id: reservation.id,
      reservationDate: formatDateOnly(reservation.reservationDate),
      source: reservation.createdByAdminId ? "admin" : "user",
      table: {
        id: reservation.table.id,
        number: reservation.table.number,
        code: reservation.table.code,
      },
      user: {
        id: reservation.user.id,
        fullName: reservation.user.fullName,
        email: reservation.user.email,
      },
    };
  }

  private assignmentConflictResponse(assignment: {
    id: string;
    userId: string;
    startsOn: Date;
    endsOn: Date | null;
    table: { id: number; number: number; code: string };
    user: { id: string; fullName: string; email: string };
  }) {
    return {
      type: "table_assignment",
      id: assignment.id,
      startsOn: formatDateOnly(assignment.startsOn),
      endsOn: assignment.endsOn ? formatDateOnly(assignment.endsOn) : null,
      table: {
        id: assignment.table.id,
        number: assignment.table.number,
        code: assignment.table.code,
      },
      user: {
        id: assignment.user.id,
        fullName: assignment.user.fullName,
        email: assignment.user.email,
      },
    };
  }

  private sameNullableDate(first: Date | null, second: Date | null) {
    if (first === null || second === null) return first === second;
    return first.getTime() === second.getTime();
  }

  private uniqueById<T extends { id: string } | null>(items: T[]) {
    const result: Exclude<T, null>[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item as Exclude<T, null>);
      }
    }
    return result;
  }

  private isDatabaseConflict(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === "P2002" || error.code === "P2010";
    }
    if (typeof error !== "object" || error === null) return false;
    const value = error as Record<string, unknown>;
    return value.code === "23P01" || String(value.message ?? "").includes("23P01");
  }
}
