import { TablesService } from "./tables.service";

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
});
