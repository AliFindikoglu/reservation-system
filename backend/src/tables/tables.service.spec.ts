import { TablesService } from "./tables.service";
import { TableReservationStatus } from "./dto/table-statuses-response.dto";

describe("TablesService", () => {
  const prisma = {
    reservation: { findMany: jest.fn() },
    table: { findMany: jest.fn() },
  };
  const service = new TablesService(prisma as never);

  beforeEach(() => {
    process.env.MAX_RESERVATION_DAYS_AHEAD = "999999";
    jest.clearAllMocks();
  });

  it("boş masaları hesaplarken yalnız aktif rezervasyonları kullanır", async () => {
    prisma.reservation.findMany.mockResolvedValue([{ tableId: 1 }]);
    prisma.table.findMany.mockResolvedValue([
      { id: 1, number: 1 },
      { id: 2, number: 2 },
    ]);

    await expect(service.findAvailable("2099-01-01")).resolves.toEqual({
      date: "2099-01-01",
      tables: [2],
    });
    expect(prisma.reservation.findMany).toHaveBeenCalledWith({
      where: {
        reservationDate: new Date("2099-01-01T00:00:00.000Z"),
        isCancelled: false,
      },
      select: { tableId: true },
    });
  });

  it("tüm masaları giriş yapan kullanıcıya göre durumlarıyla döndürür", async () => {
    prisma.reservation.findMany.mockResolvedValue([
      { tableId: 1, userId: "user-1" },
      { tableId: 2, userId: "user-2" },
    ]);
    prisma.table.findMany.mockResolvedValue([
      { id: 1, number: 1 },
      { id: 2, number: 2 },
      { id: 3, number: 3 },
    ]);

    await expect(
      service.findStatuses("2099-01-01", "user-1"),
    ).resolves.toEqual({
      date: "2099-01-01",
      tables: [
        { number: 1, status: TableReservationStatus.Mine },
        { number: 2, status: TableReservationStatus.Reserved },
        { number: 3, status: TableReservationStatus.Available },
      ],
    });
    expect(prisma.reservation.findMany).toHaveBeenCalledWith({
      where: {
        reservationDate: new Date("2099-01-01T00:00:00.000Z"),
        isCancelled: false,
      },
      select: { tableId: true, userId: true },
    });
    expect(prisma.table.findMany).toHaveBeenCalledWith({
      orderBy: { number: "asc" },
    });
  });
});
