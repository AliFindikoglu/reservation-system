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

  const firstEmail = "e2e.first@eteration.com";
  const secondEmail = "e2e.second@eteration.com";
  const password = "GucluParola1!";

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
    await prisma.user.deleteMany({
      where: { email: { in: [firstEmail, secondEmail] } },
    });
    await prisma.table.createMany({
      data: Array.from({ length: 32 }, (_, index) => ({ number: index + 1 })),
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [firstEmail, secondEmail] } },
    });
    await app.close();
  });

  it("register, login, profil, JWT koruması, sahiplik ve iptal sonrası tekrar alma akışını doğrular", async () => {
    const server = app.getHttpServer();
    const reservationDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await prisma.reservation.deleteMany({
      where: {
        reservationDate: new Date(`${reservationDate}T00:00:00.000Z`),
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
      });

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
          "Please update only the full name and phone number fields.",
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
      });

    await request(server)
      .get("/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200, {
        id: firstLogin.body.user.id,
        fullName: "Birinci Kullanıcı Güncel",
        email: firstEmail,
        phone: "05069999999",
      });

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
      .send({ tableNumber: 1, reservationDate })
      .expect(401);

    const availableBeforeCreate = await request(server)
      .get("/tables/available")
      .query({ date: reservationDate })
      .expect(200);
    expect(availableBeforeCreate.body).toMatchObject({
      date: reservationDate,
      tables: expect.arrayContaining([1]),
    });

    const created = await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ tableNumber: 1, reservationDate })
      .expect(201);
    expect(created.body).toEqual({
      id: expect.any(String),
      reservationDate,
      tableNumber: 1,
    });

    const availableAfterCreate = await request(server)
      .get("/tables/available")
      .query({ date: reservationDate })
      .expect(200);
    expect(availableAfterCreate.body.tables).not.toContain(1);

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ tableNumber: 1, reservationDate })
      .expect(409, {
        statusCode: 409,
        message: "The selected table is already reserved for this date.",
      });

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ tableNumber: 2, reservationDate })
      .expect(409, {
        statusCode: 409,
        message: "You can create only one reservation per day.",
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

    const availableAfterDelete = await request(server)
      .get("/tables/available")
      .query({ date: reservationDate })
      .expect(200);
    expect(availableAfterDelete.body.tables).toContain(1);

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ tableNumber: 1, reservationDate })
      .expect(201);
  });
});
