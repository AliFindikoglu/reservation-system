import { ForbiddenException, NotFoundException } from "@nestjs/common";
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
