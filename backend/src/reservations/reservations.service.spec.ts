import {
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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new ReservationsService(prisma as never);
  const dto = { tableNumber: 1, reservationDate: "2099-01-01" };
  beforeEach(() => {
    process.env.MAX_RESERVATION_DAYS_AHEAD = "999999";
    jest.clearAllMocks();
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
        message: "Seçtiğiniz masa bu tarihte zaten rezerve edilmiştir.",
      });
    }
    expect(prisma.reservation.create).toHaveBeenCalledTimes(2);
  });
  it("kullanıcıya yalnız kendi rezervasyonlarını döndürür", async () => {
    prisma.reservation.findMany.mockResolvedValue([]);
    await service.findMyReservations("user-1");
    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
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
  it("sahibi rezervasyonu silince kayıt kaldırılır", async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      table: { number: 1 },
    });
    await service.remove("r1", "user-1");
    expect(prisma.reservation.delete).toHaveBeenCalledWith({
      where: { id: "r1" },
    });
  });
});
