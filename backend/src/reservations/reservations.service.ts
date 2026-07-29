import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { UpdateReservationDto } from "./dto/update-reservation.dto";
import { parseReservationDate } from "./reservation-date";

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservationDto) {
    const reservationDate = parseReservationDate(dto.reservationDate);
    const table = await this.findTable(dto.tableNumber);
    try {
      const reservation = await this.prisma.reservation.create({
        data: { userId, tableId: table.id, reservationDate },
        include: { table: true },
      });
      return this.toResponse(reservation);
    } catch (error) {
      this.handleConflict(error);
      throw error;
    }
  }

  async findMyReservations(userId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId },
      include: { table: true },
      orderBy: { reservationDate: "asc" },
    });
    return reservations.map((reservation) => this.toResponse(reservation));
  }

  async update(id: string, userId: string, dto: UpdateReservationDto) {
    const existing = await this.findOwned(id, userId);
    const reservationDate = dto.reservationDate
      ? parseReservationDate(dto.reservationDate)
      : existing.reservationDate;
    const tableId = dto.tableNumber
      ? (await this.findTable(dto.tableNumber)).id
      : existing.tableId;
    try {
      const reservation = await this.prisma.reservation.update({
        where: { id },
        data: { tableId, reservationDate },
        include: { table: true },
      });
      return this.toResponse(reservation);
    } catch (error) {
      this.handleConflict(error);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    await this.findOwned(id, userId);
    await this.prisma.reservation.delete({ where: { id } });
  }

  private async findTable(number: number) {
    const table = await this.prisma.table.findUnique({ where: { number } });
    if (!table) throw new NotFoundException("Masa bulunamadı.");
    return table;
  }
  private async findOwned(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
    if (!reservation) throw new NotFoundException("Rezervasyon bulunamadı.");
    if (reservation.userId !== userId)
      throw new ForbiddenException(
        "Bu rezervasyon üzerinde işlem yapma yetkiniz bulunmamaktadır.",
      );
    return reservation;
  }
  private handleConflict(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes("userId"))
        throw new ConflictException(
          "Aynı gün için yalnızca bir rezervasyon oluşturabilirsiniz.",
        );
      throw new ConflictException(
        "Seçtiğiniz masa bu tarihte zaten rezerve edilmiştir.",
      );
    }
  }
  private toResponse(reservation: {
    id: string;
    reservationDate: Date;
    table: { number: number };
  }) {
    return {
      id: reservation.id,
      reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
      tableNumber: reservation.table.number,
    };
  }
}
