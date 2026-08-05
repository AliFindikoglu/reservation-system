import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserRole } from "@prisma/client";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { ApiExceptionFilter } from "../src/common/filters/api-exception.filter";
import { createValidationPipe } from "../src/common/validation/create-validation-pipe";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Multi-office reservation isolation (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const istanbulOfficeId = "00000000-0000-4000-8000-000000000001";
  const izmirOfficeId = "00000000-0000-4000-8000-000000000002";
  const password = "GucluParola1!";
  const emails = [
    "office.first.e2e@eteration.com",
    "office.second.e2e@eteration.com",
  ];

  async function cleanup() {
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    });
    const ids = users.map((user) => user.id);
    if (!ids.length) return;
    await prisma.reservation.deleteMany({ where: { userId: { in: ids } } });
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: ids } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(createValidationPipe());
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it("separates equal table numbers by office while preserving one booking per user/day", async () => {
    const server = app.getHttpServer();
    const first = await request(server)
      .post("/auth/register")
      .send({
        fullName: "Office First User",
        email: emails[0],
        phone: "05068880001",
        password,
      })
      .expect(201);
    const second = await request(server)
      .post("/auth/register")
      .send({
        fullName: "Office Second User",
        email: emails[1],
        phone: "05068880002",
        password,
      })
      .expect(201);
    const firstToken = first.body.accessToken as string;
    const secondToken = second.body.accessToken as string;
    const date = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const offices = await request(server).get("/offices").expect(200);
    expect(offices.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: istanbulOfficeId, city: "Istanbul" }),
        expect.objectContaining({ id: izmirOfficeId, city: "Izmir" }),
      ]),
    );

    await request(server)
      .get("/tables/available")
      .query({ date })
      .expect(400, {
        statusCode: 400,
        message: "Please enter a valid office ID.",
      });
    const izmirStatuses = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${firstToken}`)
      .query({ officeId: izmirOfficeId, date })
      .expect(200);
    expect(izmirStatuses.body.tables).toHaveLength(16);

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ tableNumber: 1, reservationDate: date })
      .expect(400, {
        statusCode: 400,
        message: "Please enter a valid office ID.",
      });

    const istanbulReservation = await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId: istanbulOfficeId, tableNumber: 1, reservationDate: date })
      .expect(201);
    expect(istanbulReservation.body.office.id).toBe(istanbulOfficeId);

    const izmirReservation = await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ officeId: izmirOfficeId, tableNumber: 1, reservationDate: date })
      .expect(201);
    expect(izmirReservation.body.office.id).toBe(izmirOfficeId);

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId: izmirOfficeId, tableNumber: 2, reservationDate: date })
      .expect(409, {
        statusCode: 409,
        message: "You can create only one reservation per day.",
      });

    await prisma.user.update({
      where: { id: first.body.user.id },
      data: { role: UserRole.ADMIN },
    });
    const adminLogin = await request(server)
      .post("/auth/login")
      .send({ email: emails[0], password })
      .expect(200);
    const filtered = await request(server)
      .get("/admin/reservations")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`)
      .query({ officeId: izmirOfficeId, startsOn: date, endsOn: date, status: "ACTIVE" })
      .expect(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0]).toMatchObject({
      id: izmirReservation.body.id,
      table: { office: { id: izmirOfficeId, city: "Izmir" } },
    });
  });
});
