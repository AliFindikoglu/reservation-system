import { TablesService } from "./tables.service";
import { TableReservationStatus } from "./dto/table-statuses-response.dto";

describe("TablesService", () => {
  const prisma = {
    reservation: { findMany: jest.fn() },
    tableAssignment: { findMany: jest.fn() },
    table: { findMany: jest.fn(), findUnique: jest.fn() },
  };
  const service = new TablesService(prisma as never);

  beforeEach(() => {
    process.env.MAX_RESERVATION_DAYS_AHEAD = "999999";
    jest.clearAllMocks();
    prisma.tableAssignment.findMany.mockResolvedValue([]);
  });

  it("boş masaları hesaplarken yalnız aktif rezervasyonları kullanır", async () => {
    prisma.reservation.findMany.mockResolvedValue([{ tableId: 1 }]);
    prisma.table.findMany.mockResolvedValue([
      { id: 1, number: 1, code: "A1", equipments: [] },
      { id: 2, number: 2, code: "A2", equipments: [] },
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
      select: { tableId: true, userId: true, createdByAdminId: true },
    });
  });

  it("tarih aralıklı ataması bulunan masayı boş listeden çıkarır", async () => {
    prisma.reservation.findMany.mockResolvedValue([]);
    prisma.tableAssignment.findMany.mockResolvedValue([{ tableId: 2 }]);
    prisma.table.findMany.mockResolvedValue([
      { id: 1, number: 1 },
      { id: 2, number: 2 },
    ]);
    await expect(service.findAvailable("2099-01-01")).resolves.toEqual({
      date: "2099-01-01",
      tables: [1],
    });
  });

  it("tüm masaları giriş yapan kullanıcıya göre durumlarıyla döndürür", async () => {
    prisma.reservation.findMany.mockResolvedValue([
      { tableId: 1, userId: "user-1", createdByAdminId: null },
      { tableId: 2, userId: "user-2", createdByAdminId: null },
    ]);
    prisma.table.findMany.mockResolvedValue([
      { id: 1, number: 1, code: "A1", equipments: [] },
      { id: 2, number: 2, code: "A2", equipments: [] },
      { id: 3, number: 3, code: "A3", equipments: [] },
    ]);

    await expect(
      service.findStatuses("2099-01-01", "user-1"),
    ).resolves.toEqual({
      date: "2099-01-01",
      tables: [
        { id: 1, number: 1, code: "A1", status: TableReservationStatus.Mine, equipments: [] },
        { id: 2, number: 2, code: "A2", status: TableReservationStatus.Reserved, equipments: [] },
        { id: 3, number: 3, code: "A3", status: TableReservationStatus.Available, equipments: [] },
      ],
    });
    expect(prisma.reservation.findMany).toHaveBeenCalledWith({
      where: {
        reservationDate: new Date("2099-01-01T00:00:00.000Z"),
        isCancelled: false,
      },
      select: { tableId: true, userId: true, createdByAdminId: true },
    });
    expect(prisma.table.findMany).toHaveBeenCalledWith({
      orderBy: { number: "asc" },
      include: {
        equipments: {
          where: { equipment: { isActive: true } },
          include: { equipment: true },
          orderBy: { equipment: { name: "asc" } },
        },
      },
    });
  });

  it("admin günlük rezervasyonu atama sahibini başka masaya taşıdığında eski atanan masayı boş gösterir", async () => {
    prisma.reservation.findMany.mockResolvedValue([
      { tableId: 2, userId: "user-1", createdByAdminId: "admin-1" },
    ]);
    prisma.tableAssignment.findMany.mockResolvedValue([
      { tableId: 1, userId: "user-1" },
    ]);
    prisma.table.findMany.mockResolvedValue([
      { id: 1, number: 1, code: "A1", equipments: [] },
      { id: 2, number: 2, code: "A2", equipments: [] },
    ]);

    await expect(
      service.findStatuses("2099-01-01", "user-1"),
    ).resolves.toEqual({
      date: "2099-01-01",
      tables: [
        {
          id: 1,
          number: 1,
          code: "A1",
          status: TableReservationStatus.Available,
          equipments: [],
        },
        {
          id: 2,
          number: 2,
          code: "A2",
          status: TableReservationStatus.Mine,
          equipments: [],
        },
      ],
    });
  });
});
