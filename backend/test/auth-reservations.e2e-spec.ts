import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { ApiExceptionFilter } from "../src/common/filters/api-exception.filter";
import { createValidationPipe } from "../src/common/validation/create-validation-pipe";
import { PrismaService } from "../src/prisma/prisma.service";

describe("JWT kullanıcı ve rezervasyon akışı (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const officeId = "00000000-0000-4000-8000-000000000001";
  const officeResponse = {
    id: officeId,
    name: "Istanbul Office",
    city: "Istanbul",
  };
  const izmirOfficeId = "00000000-0000-4000-8000-000000000002";
  const izmirOfficeResponse = {
    id: izmirOfficeId,
    name: "Izmir Office",
    city: "Izmir",
  };
  const equipmentId = "00000000-0000-4000-8000-000000000101";
  const equipmentResponse = {
    id: equipmentId,
    code: "E2E_MONITOR",
    name: "E2E Monitor",
  };

  const firstEmail = "e2e.first@eteration.com";
  const secondEmail = "e2e.second@eteration.com";
  const password = "GucluParola1!";
  const newPassword = "YeniGucluParola2!";

  async function cleanupTestUsers() {
    const users = await prisma.user.findMany({
      where: { email: { in: [firstEmail, secondEmail] } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    if (!userIds.length) return;
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: userIds } } });
    await prisma.reservation.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.tableAssignment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userRestriction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(createValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
    await cleanupTestUsers();
    await prisma.office.upsert({
      where: { id: officeId },
      create: {
        id: officeId,
        name: "Istanbul Office",
        city: "Istanbul",
      },
      update: { isActive: true },
    });
    await prisma.table.createMany({
      data: Array.from({ length: 32 }, (_, index) => ({
        officeId,
        number: index + 1,
        code: `${String.fromCharCode(65 + Math.floor(index / 8))}${(index % 8) + 1}`,
      })),
      skipDuplicates: true,
    });
    await prisma.office.upsert({
      where: { id: izmirOfficeId },
      create: izmirOfficeResponse,
      update: { ...izmirOfficeResponse, isActive: true },
    });
    const tableOne = await prisma.table.findUniqueOrThrow({
      where: { officeId_number: { officeId, number: 1 } },
    });
    await prisma.equipment.upsert({
      where: { code: equipmentResponse.code },
      create: { ...equipmentResponse, isActive: true },
      update: { name: equipmentResponse.name, isActive: true },
    });
    await prisma.tableEquipment.upsert({
      where: {
        tableId_equipmentId: {
          tableId: tableOne.id,
          equipmentId,
        },
      },
      create: { tableId: tableOne.id, equipmentId },
      update: {},
    });
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await prisma.tableEquipment.deleteMany({ where: { equipmentId } });
    await prisma.equipment.deleteMany({ where: { id: equipmentId } });
    await app.close();
  });

  it("register, login, profil, JWT koruması, sahiplik ve iptal sonrası tekrar alma akışını doğrular", async () => {
    const server = app.getHttpServer();
    const reservationDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const editDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await prisma.reservation.deleteMany({
      where: {
        reservationDate: {
          in: [
            new Date(`${reservationDate}T00:00:00.000Z`),
            new Date(`${editDate}T00:00:00.000Z`),
          ],
        },
      },
    });

    await request(server).get("/olmayan-adres").expect(404, {
      statusCode: 404,
      message: "The requested API endpoint was not found.",
    });

    const invalidRegister = await request(server)
      .post("/auth/register")
      .send({
        fullName: "   ",
        email: "gecersiz",
        phone: "123",
        password: "kısa",
      })
      .expect(400);
    expect(invalidRegister.body).toEqual({
      statusCode: 400,
      message: "Please enter your full name.",
    });

    await request(server)
      .post("/auth/register")
      .send({
        fullName: "Phone Validation User",
        email: "phone.validation@eteration.com",
        phone: "05062134217dsad",
        password,
      })
      .expect(400, {
        statusCode: 400,
        message: "Please enter an 11-digit phone number starting with 05.",
      });

    await request(server)
      .post("/auth/register")
      .send({
        fullName: "Email Validation User",
        email: "email.validation@example.com",
        phone: "05061112236",
        password,
      })
      .expect(400, {
        statusCode: 400,
        message: "Please use your company email address.",
      });

    await request(server)
      .post("/auth/register")
      .send({
        fullName: "Password Validation User",
        email: "password.validation@eteration.com",
        phone: "05061112237",
        password: "password",
      })
      .expect(400, {
        statusCode: 400,
        message:
          "Please enter a password of at least 8 characters containing an uppercase letter, a lowercase letter, a number, and a symbol, with no spaces.",
      });

    const firstRegister = await request(server)
      .post("/auth/register")
      .send({
        fullName: "Birinci Kullanıcı",
        email: firstEmail,
        phone: "05061112233",
        password,
      })
      .expect(201);
    expect(firstRegister.body.accessToken).toEqual(expect.any(String));
    expect(firstRegister.body.user.passwordHash).toBeUndefined();

    await request(server)
      .post("/auth/register")
      .send({
        fullName: "Tekrar Kayıt",
        email: firstEmail.toUpperCase(),
        phone: "05061112235",
        password,
      })
      .expect(409, {
        statusCode: 409,
        message:
          "A user with this email address already exists.",
      });

    await request(server)
      .post("/auth/register")
      .send({
        fullName: "İkinci Kullanıcı",
        email: secondEmail,
        phone: "05061112234",
        password,
      })
      .expect(201);

    const firstLogin = await request(server)
      .post("/auth/login")
      .send({ email: firstEmail, password })
      .expect(200);
    const secondLogin = await request(server)
      .post("/auth/login")
      .send({ email: secondEmail, password })
      .expect(200);

    await request(server)
      .post("/auth/login")
      .send({ email: firstEmail, password: "yanlis-parola" })
      .expect(401, {
        statusCode: 401,
        message: "Please check your email address and password.",
      });
    const firstToken = firstLogin.body.accessToken as string;
    const secondToken = secondLogin.body.accessToken as string;

    await request(server).get("/auth/me").expect(401, {
      statusCode: 401,
      message: "Please sign in to perform this action.",
    });
    await request(server)
      .get("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200, {
        id: firstLogin.body.user.id,
        fullName: "Birinci Kullanıcı",
        email: firstEmail,
        phone: "05061112233",
        role: "USER",
        isActive: true,
        preferredOfficeId: officeId,
        preferredOffice: officeResponse,
        themePreference: "LIGHT",
      });

    await request(server)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ preferredOfficeId: izmirOfficeId, themePreference: "DARK" })
      .expect(200, {
        id: firstLogin.body.user.id,
        fullName: "Birinci Kullanıcı",
        email: firstEmail,
        phone: "05061112233",
        role: "USER",
        isActive: true,
        preferredOfficeId: izmirOfficeId,
        preferredOffice: izmirOfficeResponse,
        themePreference: "DARK",
      });

    await request(server)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ preferredOfficeId: officeId, themePreference: "LIGHT" })
      .expect(200);

    await request(server)
      .patch("/auth/me")
      .send({ fullName: "Yetkisiz Değişiklik" })
      .expect(401);

    await request(server)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ email: "degistirilemez@eteration.com" })
      .expect(400, {
        statusCode: 400,
        message:
          "Please update only supported profile and preference fields.",
      });

    await request(server)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ fullName: "   " })
      .expect(400);

    await request(server)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({
        fullName: "Birinci Kullanıcı Güncel",
        phone: "05069999999",
      })
      .expect(200, {
        id: firstLogin.body.user.id,
        fullName: "Birinci Kullanıcı Güncel",
        email: firstEmail,
        phone: "05069999999",
        role: "USER",
        isActive: true,
        preferredOfficeId: officeId,
        preferredOffice: officeResponse,
        themePreference: "LIGHT",
      });

    await request(server)
      .get("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200, {
        id: firstLogin.body.user.id,
        fullName: "Birinci Kullanıcı Güncel",
        email: firstEmail,
        phone: "05069999999",
        role: "USER",
        isActive: true,
        preferredOfficeId: officeId,
        preferredOffice: officeResponse,
        themePreference: "LIGHT",
      });

    await request(server)
      .patch("/auth/me/password")
      .send({
        currentPassword: password,
        newPassword,
      })
      .expect(401, {
        statusCode: 401,
        message: "Please sign in to perform this action.",
      });

    await request(server)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({
        currentPassword: "YanlisParola1!",
        newPassword,
      })
      .expect(401, {
        statusCode: 401,
        message: "The current password is incorrect.",
      });

    await request(server)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({
        currentPassword: password,
        newPassword: "weak",
      })
      .expect(400, {
        statusCode: 400,
        message:
          "Please enter a password of at least 8 characters containing an uppercase letter, a lowercase letter, a number, and a symbol, with no spaces.",
      });

    await request(server)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({
        currentPassword: password,
        newPassword: password,
      })
      .expect(400, {
        statusCode: 400,
        message:
          "The new password must be different from the current password.",
      });

    await request(server)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({
        currentPassword: password,
        newPassword,
      })
      .expect(200, {
        message: "Your password has been changed successfully.",
      });

    await request(server)
      .post("/auth/login")
      .send({ email: firstEmail, password })
      .expect(401, {
        statusCode: 401,
        message: "Please check your email address and password.",
      });

    await request(server)
      .post("/auth/login")
      .send({ email: firstEmail, password: newPassword })
      .expect(200);

    const expiredToken = jwtService.sign(
      { userId: firstLogin.body.user.id, email: firstEmail },
      { expiresIn: -1 },
    );
    await request(server)
      .get("/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401, {
        statusCode: 401,
        message:
          "Your session has expired. Please sign in again.",
      });

    await request(server)
      .post("/reservations")
      .send({ officeId, tableNumber: 1, reservationDate })
      .expect(401);

    await request(server)
      .get("/tables/statuses")
      .query({ officeId, date: reservationDate })
      .expect(401, {
        statusCode: 401,
        message: "Please sign in to perform this action.",
      });

    const availableBeforeCreate = await request(server)
      .get("/tables/available")
      .query({ officeId, date: reservationDate })
      .expect(200);
    expect(availableBeforeCreate.body).toMatchObject({
      officeId,
      date: reservationDate,
      tables: expect.arrayContaining([1]),
    });

    const statusesBeforeCreate = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${firstToken}`)
      .query({ officeId, date: reservationDate })
      .expect(200);
    expect(statusesBeforeCreate.body.tables).toHaveLength(32);
    expect(statusesBeforeCreate.body.tables).toContainEqual(
      expect.objectContaining({ number: 1, status: "available" }),
    );

    const created = await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId, tableNumber: 1, reservationDate })
      .expect(201);
    expect(created.body).toMatchObject({
      id: expect.any(String),
      reservationDate,
      tableNumber: 1,
      office: officeResponse,
    });
    expect(created.body.equipments).toEqual(
      expect.arrayContaining([equipmentResponse]),
    );

    const reservationsWithEquipments = await request(server)
      .get("/reservations/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    expect(reservationsWithEquipments.body).toContainEqual(
      expect.objectContaining({
        id: created.body.id,
        equipments: expect.arrayContaining([equipmentResponse]),
      }),
    );

    const availableAfterCreate = await request(server)
      .get("/tables/available")
      .query({ officeId, date: reservationDate })
      .expect(200);
    expect(availableAfterCreate.body.tables).not.toContain(1);

    const firstUserStatuses = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${firstToken}`)
      .query({ officeId, date: reservationDate })
      .expect(200);
    expect(firstUserStatuses.body.tables).toContainEqual(
      expect.objectContaining({ number: 1, status: "mine" }),
    );

    const secondUserStatuses = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${secondToken}`)
      .query({ officeId, date: reservationDate })
      .expect(200);
    expect(secondUserStatuses.body.tables).toContainEqual(
      expect.objectContaining({ number: 1, status: "reserved" }),
    );

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ officeId, tableNumber: 1, reservationDate })
      .expect(409, {
        statusCode: 409,
        message: "The selected table is already reserved for this date.",
      });

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId, tableNumber: 2, reservationDate })
      .expect(409, {
        statusCode: 409,
        message: "You can create only one reservation per day.",
      });

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ officeId, tableNumber: 2, reservationDate: editDate })
      .expect(201);

    const updatedReservation = await request(server)
      .patch(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId, tableNumber: 3, reservationDate: editDate })
      .expect(200);
    expect(updatedReservation.body).toMatchObject({
        id: created.body.id,
        reservationDate: editDate,
        tableNumber: 3,
        office: officeResponse,
        equipments: expect.any(Array),
      });

    const availableAfterEditOnOldDate = await request(server)
      .get("/tables/available")
      .query({ officeId, date: reservationDate })
      .expect(200);
    expect(availableAfterEditOnOldDate.body.tables).toContain(1);

    const availableAfterEditOnNewDate = await request(server)
      .get("/tables/available")
      .query({ officeId, date: editDate })
      .expect(200);
    expect(availableAfterEditOnNewDate.body.tables).not.toContain(3);

    await request(server)
      .patch(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId, tableNumber: 2, reservationDate: editDate })
      .expect(409, {
        statusCode: 409,
        message: "Update failed.",
      });

    const firstUserReservationsAfterFailedEdit = await request(server)
      .get("/reservations/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    expect(firstUserReservationsAfterFailedEdit.body).toContainEqual({
      id: created.body.id,
      reservationDate: editDate,
      tableNumber: 3,
      office: officeResponse,
      equipments: expect.any(Array),
    });

    const secondReservationForFirstUser = await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId, tableNumber: 4, reservationDate })
      .expect(201);

    await request(server)
      .patch(`/reservations/${secondReservationForFirstUser.body.id}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId, tableNumber: 4, reservationDate: editDate })
      .expect(409, {
        statusCode: 409,
        message: "Update failed.",
      });

    await request(server)
      .patch("/reservations/gecersiz-kimlik")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ tableNumber: 2 })
      .expect(400, {
        statusCode: 400,
        message: "Please enter a valid reservation ID.",
      });

    await request(server)
      .patch(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ tableNumber: 2 })
      .expect(403, {
        statusCode: 403,
        message:
          "You do not have permission to modify this reservation.",
      });
    await request(server)
      .delete(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .expect(403, {
        statusCode: 403,
        message:
          "You do not have permission to modify this reservation.",
      });

    await request(server)
      .delete("/reservations/00000000-0000-4000-8000-000000000000")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(404, {
        statusCode: 404,
        message: "Reservation not found.",
      });

    await request(server)
      .delete(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(204);

    const cancelledReservation =
      await prisma.reservation.findUnique({
        where: { id: created.body.id },
      });
    expect(cancelledReservation).toMatchObject({
      id: created.body.id,
      isCancelled: true,
      cancelledAt: expect.any(Date),
    });

    const firstUserReservationsAfterCancellation = await request(server)
      .get("/reservations/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    expect(firstUserReservationsAfterCancellation.body).not.toContainEqual(
      expect.objectContaining({ id: created.body.id }),
    );

    const availableAfterDelete = await request(server)
      .get("/tables/available")
      .query({ officeId, date: editDate })
      .expect(200);
    expect(availableAfterDelete.body.tables).toContain(3);

    const statusesAfterDelete = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${firstToken}`)
      .query({ officeId, date: editDate })
      .expect(200);
    expect(statusesAfterDelete.body.tables).toContainEqual(
      expect.objectContaining({ number: 3, status: "available" }),
    );

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ officeId, tableNumber: 3, reservationDate: editDate })
      .expect(201);

    await request(server)
      .patch(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ tableNumber: 5, reservationDate: editDate })
      .expect(400, {
        statusCode: 400,
        message: "Cancelled reservations cannot be modified.",
      });
  });
});
