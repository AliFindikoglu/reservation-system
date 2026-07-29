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
      message: "İstenen API adresi bulunamadı.",
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
      message: "Adınızı ve soyadınızı giriniz.",
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
          "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten bulunmaktadır.",
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
        message: "E-posta adresinizi ve parolanızı kontrol ediniz.",
      });
    const firstToken = firstLogin.body.accessToken as string;
    const secondToken = secondLogin.body.accessToken as string;

    await request(server).get("/auth/me").expect(401, {
      statusCode: 401,
      message: "Bu işlem için giriş yapınız.",
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
          "Yalnızca ad soyad ve telefon numarası alanlarını güncelleyiniz.",
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
          "Oturum süreniz dolmuştur. Lütfen yeniden giriş yapınız.",
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
        message: "Seçtiğiniz masa bu tarihte zaten rezerve edilmiştir.",
      });

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ tableNumber: 2, reservationDate })
      .expect(409, {
        statusCode: 409,
        message: "Aynı gün için yalnızca bir rezervasyon oluşturabilirsiniz.",
      });

    await request(server)
      .patch("/reservations/gecersiz-kimlik")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ tableNumber: 2 })
      .expect(400, {
        statusCode: 400,
        message: "Geçerli bir rezervasyon kimliği giriniz.",
      });

    await request(server)
      .patch(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ tableNumber: 2 })
      .expect(403, {
        statusCode: 403,
        message:
          "Bu rezervasyon üzerinde işlem yapma yetkiniz bulunmamaktadır.",
      });
    await request(server)
      .delete(`/reservations/${created.body.id}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .expect(403, {
        statusCode: 403,
        message:
          "Bu rezervasyon üzerinde işlem yapma yetkiniz bulunmamaktadır.",
      });

    await request(server)
      .delete("/reservations/00000000-0000-4000-8000-000000000000")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(404, {
        statusCode: 404,
        message: "Rezervasyon bulunamadı.",
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
