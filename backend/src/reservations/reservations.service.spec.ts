import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ReservationsService } from "./reservations.service";

describe("ReservationsService", () => {
  const prisma = {
    table: { findUnique: jest.fn() },
    reservation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userRestriction: { findFirst: jest.fn() },
    tableAssignment: { findFirst: jest.fn() },
  };
  const service = new ReservationsService(prisma as never);
  const dto = { tableNumber: 1, reservationDate: "2099-01-01" };
  beforeEach(() => {
    process.env.MAX_RESERVATION_DAYS_AHEAD = "999999";
    jest.resetAllMocks();
    prisma.reservation.findFirst.mockResolvedValue(null);
    prisma.userRestriction.findFirst.mockResolvedValue(null);
    prisma.tableAssignment.findFirst.mockResolvedValue(null);
  });

  it("giriş yapan kullanıcı adına rezervasyon oluşturur", async () => {
    prisma.table.findUnique.mockResolvedValue({ id: 1, number: 1 });
    prisma.reservation.create.mockResolvedValue({
      id: "r1",
      reservationDate: new Date("2099-01-01"),
      table: { number: 1 },
    });
    await expect(service.create("user-1", dto)).resolves.toMatchObject({
      id: "r1",
      tableNumber: 1,
    });
    expect(prisma.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });
  it("aynı masa ve tarih için eşzamanlı isteklerden yalnız birini kabul eder", async () => {
    prisma.table.findUnique.mockResolvedValue({ id: 1, number: 1 });

    const successfulReservation = {
      id: "reservation-1",
      reservationDate: new Date("2099-01-01"),
      table: { number: 1 },
    };
    const uniqueConstraintError =
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on tableId and reservationDate",
        {
          code: "P2002",
          clientVersion: Prisma.prismaVersion.client,
          meta: { target: ["tableId", "reservationDate"] },
        },
      );

    prisma.reservation.create
      .mockResolvedValueOnce(successfulReservation)
      .mockRejectedValueOnce(uniqueConstraintError);

    const results = await Promise.allSettled([
      service.create("user-1", dto),
      service.create("user-2", dto),
    ]);

    expect(results[0]).toMatchObject({
      status: "fulfilled",
      value: {
        id: "reservation-1",
        tableNumber: 1,
      },
    });
    expect(results[1]).toMatchObject({
      status: "rejected",
      reason: expect.any(ConflictException),
    });

    const rejectedResult = results[1];
    if (rejectedResult.status === "rejected") {
      expect(rejectedResult.reason).toMatchObject({
        message: "The selected table is already reserved for this date.",
      });
    }
    expect(prisma.reservation.create).toHaveBeenCalledTimes(2);
  });
  it("kullanıcıya yalnız kendi rezervasyonlarını döndürür", async () => {
    prisma.reservation.findMany.mockResolvedValue([]);
    await service.findMyReservations("user-1");
    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", isCancelled: false },
      }),
    );
  });
  it("ceza tarihindeki rezervasyon isteğini reddeder", async () => {
    prisma.table.findUnique.mockResolvedValue({ id: 1, number: 1 });
    prisma.userRestriction.findFirst.mockResolvedValue({ id: "restriction-1" });
    await expect(service.create("user-1", dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.reservation.create).not.toHaveBeenCalled();
  });

  it("kullanıcının atanmış masası olan gün başka rezervasyon oluşturmasını reddeder", async () => {
    prisma.table.findUnique.mockResolvedValue({ id: 1, number: 1 });
    prisma.tableAssignment.findFirst
      .mockResolvedValueOnce({ id: "assignment-1", tableId: 2 })
      .mockResolvedValueOnce(null);
    await expect(service.create("user-1", dto)).rejects.toEqual(
      new ConflictException("You already have an assigned table for this date."),
    );
  });
  it("rezervasyon kimliğini değiştirmeden tarih ve masayı günceller", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      tableId: 1,
      reservationDate: new Date("2099-01-01"),
      isCancelled: false,
      table: { number: 1 },
    });
    prisma.table.findUnique.mockResolvedValue({ id: 2, number: 2 });
    prisma.reservation.update.mockResolvedValue({
      id: "r1",
      reservationDate: new Date("2099-01-02"),
      table: { number: 2 },
    });

    await expect(
      service.update("r1", "user-1", {
        tableNumber: 2,
        reservationDate: "2099-01-02",
      }),
    ).resolves.toEqual({
      id: "r1",
      reservationDate: "2099-01-02",
      tableNumber: 2,
    });
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: {
        tableId: 2,
        reservationDate: new Date("2099-01-02T00:00:00.000Z"),
      },
      include: { table: true },
    });
  });
  it("güncelleme çakışmasında Update failed mesajı döndürür", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      tableId: 1,
      reservationDate: new Date("2099-01-01"),
      isCancelled: false,
      table: { number: 1 },
    });
    prisma.table.findUnique.mockResolvedValue({ id: 2, number: 2 });
    prisma.reservation.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: Prisma.prismaVersion.client,
          meta: {
            target: ["tableId", "reservationDate"],
          },
        },
      ),
    );

    await expect(
      service.update("r1", "user-1", {
        tableNumber: 2,
        reservationDate: "2099-01-02",
      }),
    ).rejects.toEqual(new ConflictException("Update failed."));
  });
  it("geçmiş rezervasyonun güncellenmesini engeller", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      tableId: 1,
      reservationDate: new Date("2000-01-01"),
      isCancelled: false,
      table: { number: 1 },
    });

    await expect(
      service.update("r1", "user-1", { tableNumber: 2 }),
    ).rejects.toEqual(
      new BadRequestException("Past reservations cannot be updated."),
    );
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });
  it("iptal edilmiş rezervasyonun güncellenmesini engeller", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      tableId: 1,
      reservationDate: new Date("2099-01-01"),
      isCancelled: true,
      table: { number: 1 },
    });

    await expect(
      service.update("r1", "user-1", { tableNumber: 2 }),
    ).rejects.toEqual(
      new BadRequestException(
        "Cancelled reservations cannot be modified.",
      ),
    );
  });
  it("boş güncelleme gövdesini reddeder", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      tableId: 1,
      reservationDate: new Date("2099-01-01"),
      isCancelled: false,
      table: { number: 1 },
    });

    await expect(service.update("r1", "user-1", {})).rejects.toEqual(
      new BadRequestException(
        "Please provide a reservation date or table number to update.",
      ),
    );
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });
  it("başka kullanıcının rezervasyonunu değiştirmeyi engeller", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-2",
      table: { number: 1 },
    });
    await expect(service.update("r1", "user-1", {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it("bulunmayan rezervasyonu silmeyi reddeder", async () => {
    prisma.reservation.findUnique.mockResolvedValue(null);
    await expect(service.remove("missing", "user-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it("sahibi rezervasyonu iptal edince kayıt soft-delete edilir", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      reservationDate: new Date("2099-01-01"),
      isCancelled: false,
      table: { number: 1 },
    });
    await service.remove("r1", "user-1");
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: {
        isCancelled: true,
        cancelledAt: expect.any(Date),
        cancelledByUserId: "user-1",
        cancellationReason: "Cancelled by the user.",
      },
    });
  });
});
