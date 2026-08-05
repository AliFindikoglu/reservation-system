import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserRole } from "@prisma/client";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { ApiExceptionFilter } from "../src/common/filters/api-exception.filter";
import { createValidationPipe } from "../src/common/validation/create-validation-pipe";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Admin reservation domain (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const officeId = "00000000-0000-4000-8000-000000000001";
  const password = "GucluParola1!";
  const emails = [
    "admin.e2e@eteration.com",
    "assigned.e2e@eteration.com",
    "other.e2e@eteration.com",
  ];
  const testEquipment = { name: "E2E Foot Rest", code: "E2E_FOOT_REST" };

  const dateFromNow = (days: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };

  async function cleanup() {
    await prisma.equipment.deleteMany({ where: { code: testEquipment.code } });
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    });
    const ids = users.map((user) => user.id);
    if (!ids.length) return;
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: ids } } });
    await prisma.reservation.deleteMany({ where: { userId: { in: ids } } });
    await prisma.tableAssignment.deleteMany({
      where: { OR: [{ userId: { in: ids } }, { createdByAdminId: { in: ids } }] },
    });
    await prisma.userRestriction.deleteMany({
      where: { OR: [{ userId: { in: ids } }, { createdByAdminId: { in: ids } }] },
    });
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

  it("enforces admin roles, assignments, temporary overrides, restrictions, equipment and soft deactivation", async () => {
    const server = app.getHttpServer();
    const registrations = [] as Array<{ body: { accessToken: string; user: { id: string } } }>;
    for (const [index, email] of emails.entries()) {
      registrations.push(
        await request(server)
          .post("/auth/register")
          .send({
            fullName: `Admin E2E User ${index + 1}`,
            email,
            phone: `050611122${40 + index}`,
            password,
          })
          .expect(201),
      );
    }
    const [adminRegistration, assignedRegistration, otherRegistration] = registrations;
    await prisma.user.update({
      where: { id: adminRegistration.body.user.id },
      data: { role: UserRole.ADMIN },
    });
    const adminToken = adminRegistration.body.accessToken;
    const assignedToken = assignedRegistration.body.accessToken;
    const otherToken = otherRegistration.body.accessToken;

    await request(server)
      .get("/admin/users")
      .set("Authorization", `Bearer ${assignedToken}`)
      .expect(403, {
        statusCode: 403,
        message: "Administrator permission is required to perform this action.",
      });

    const equipmentList = await request(server)
      .get("/equipments")
      .set("Authorization", `Bearer ${assignedToken}`)
      .expect(200);
    expect(equipmentList.body.equipments.length).toBeGreaterThanOrEqual(10);
    expect(equipmentList.body.equipments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MONITOR" }),
        expect.objectContaining({ code: "DUAL_MONITOR" }),
      ]),
    );

    await request(server)
      .post("/admin/equipments")
      .set("Authorization", `Bearer ${assignedToken}`)
      .send(testEquipment)
      .expect(403);

    await request(server)
      .post("/admin/equipments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(testEquipment)
      .expect(201)
      .expect((response) => {
        expect(response.body.code).toBe(testEquipment.code);
      });

    await request(server)
      .post("/admin/equipments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(testEquipment)
      .expect(409, {
        statusCode: 409,
        message: "An equipment type with this name or code already exists.",
      });

    const monitorIds = equipmentList.body.equipments
      .filter((equipment: { code: string }) => ["MONITOR", "DUAL_MONITOR"].includes(equipment.code))
      .map((equipment: { id: string }) => equipment.id);
    const selectedEquipmentIds = equipmentList.body.equipments
      .slice(0, 2)
      .map((equipment: { id: string }) => equipment.id);
    const table = await prisma.table.findUniqueOrThrow({
      where: { officeId_number: { officeId, number: 10 } },
    });

    await request(server)
      .put(`/admin/tables/${table.id}/equipments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ officeId, equipmentIds: monitorIds })
      .expect(400, {
        statusCode: 400,
        message: "Please select either Monitor or Dual Monitor, not both.",
      });

    await request(server)
      .put(`/admin/tables/${table.id}/equipments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ officeId, equipmentIds: selectedEquipmentIds })
      .expect(200)
      .expect((response) => {
        expect(response.body.table.equipments).toHaveLength(2);
      });

    const startsOn = dateFromNow(2);
    const endsOn = dateFromNow(5);
    const assignmentCommand = {
      userId: assignedRegistration.body.user.id,
      officeId,
      tableNumber: 10,
      startsOn,
      endsOn,
    };
    await request(server)
      .post("/admin/table-assignments/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(assignmentCommand)
      .expect(200)
      .expect((response) => {
        expect(response.body.requiresConfirmation).toBe(false);
      });
    const assignment = await request(server)
      .post("/admin/table-assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(assignmentCommand)
      .expect(201);
    expect(assignment.body.endsOn).toBe(endsOn);

    await request(server)
      .post("/admin/table-assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(assignmentCommand)
      .expect(409, {
        statusCode: 409,
        message: "This table assignment already exists.",
      });

    await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${assignedToken}`)
      .send({ officeId, tableNumber: 11, reservationDate: startsOn })
      .expect(409, {
        statusCode: 409,
        message: "You already have an assigned table for this date.",
      });

    const assignedStatuses = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${assignedToken}`)
      .query({ officeId, date: startsOn })
      .expect(200);
    expect(assignedStatuses.body.tables).toContainEqual(
      expect.objectContaining({
        number: 10,
        code: "B2",
        status: "mine",
        equipments: expect.any(Array),
      }),
    );

    const overrideCommand = {
      userId: otherRegistration.body.user.id,
      officeId,
      tableNumber: 10,
      reservationDate: startsOn,
      confirmOverride: true,
    };
    const override = await request(server)
      .post("/admin/reservations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(overrideCommand)
      .expect(201);

    const adminStatuses = await request(server)
      .get("/admin/tables/statuses")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ officeId, date: startsOn })
      .expect(200);
    expect(adminStatuses.body.tables).toContainEqual(
      expect.objectContaining({ number: 10, status: "admin_reserved" }),
    );

    const overriddenStatuses = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${assignedToken}`)
      .query({ officeId, date: startsOn })
      .expect(200);
    expect(overriddenStatuses.body.tables).toContainEqual(
      expect.objectContaining({ number: 10, status: "reserved" }),
    );

    await request(server)
      .delete(`/admin/reservations/${override.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Daily override no longer required" })
      .expect(200);
    const resumedStatuses = await request(server)
      .get("/tables/statuses")
      .set("Authorization", `Bearer ${assignedToken}`)
      .query({ officeId, date: startsOn })
      .expect(200);
    expect(resumedStatuses.body.tables).toContainEqual(
      expect.objectContaining({ number: 10, status: "mine" }),
    );

    const replacementDate = dateFromNow(7);
    const displacedReservation = await request(server)
      .post("/reservations")
      .set("Authorization", `Bearer ${assignedToken}`)
      .send({ officeId, tableNumber: 13, reservationDate: replacementDate })
      .expect(201);

    await request(server)
      .post("/admin/reservations/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: otherRegistration.body.user.id,
        officeId,
        tableNumber: 15,
        reservationDate: replacementDate,
        replacementTableNumber: 16,
      })
      .expect(400, {
        statusCode: 400,
        message:
          "A replacement table can only be selected when another user occupies the target table.",
      });

    await request(server)
      .post("/admin/reservations/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: otherRegistration.body.user.id,
        officeId,
        tableNumber: 13,
        reservationDate: replacementDate,
        replacementTableNumber: 13,
      })
      .expect(400, {
        statusCode: 400,
        message: "The replacement table must be different from the target table.",
      });

    const replacementPreview = await request(server)
      .post("/admin/reservations/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: otherRegistration.body.user.id,
        officeId,
        tableNumber: 13,
        reservationDate: replacementDate,
        replacementTableNumber: 14,
      })
      .expect(200);
    expect(replacementPreview.body).toEqual(
      expect.objectContaining({
        requiresConfirmation: true,
        replacement: expect.objectContaining({
          displacedUser: expect.objectContaining({
            id: assignedRegistration.body.user.id,
          }),
          table: expect.objectContaining({ number: 14, code: "B6" }),
          source: "reservation",
        }),
      }),
    );

    const replacementOverride = await request(server)
      .post("/admin/reservations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: otherRegistration.body.user.id,
        officeId,
        tableNumber: 13,
        reservationDate: replacementDate,
        replacementTableNumber: 14,
        confirmOverride: true,
      })
      .expect(201);
    expect(replacementOverride.body.replacementReservation).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: assignedRegistration.body.user.id,
        }),
        table: expect.objectContaining({ number: 14, code: "B6" }),
      }),
    );
    expect(
      await prisma.reservation.findUnique({
        where: { id: displacedReservation.body.id },
        select: { isCancelled: true },
      }),
    ).toEqual({ isCancelled: true });

    const linkedReplacement = await prisma.reservation.findUnique({
      where: {
        replacementForReservationId: replacementOverride.body.id,
      },
      select: { id: true, userId: true, tableId: true, isCancelled: true },
    });
    expect(linkedReplacement).toEqual(
      expect.objectContaining({
        userId: assignedRegistration.body.user.id,
        isCancelled: false,
      }),
    );

    await request(server)
      .delete(`/admin/reservations/${replacementOverride.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Replacement scenario completed" })
      .expect(200);
    expect(
      await prisma.reservation.findUnique({
        where: { id: linkedReplacement!.id },
        select: { isCancelled: true },
      }),
    ).toEqual({ isCancelled: true });

    const restrictedReservation = await request(server)
      .post("/admin/reservations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: otherRegistration.body.user.id,
        officeId,
        tableNumber: 12,
        reservationDate: startsOn,
      })
      .expect(201);
    await request(server)
      .post("/admin/restrictions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: otherRegistration.body.user.id,
        startsOn,
        endsOn,
        reason: "Policy violation",
        confirmImpact: true,
      })
      .expect(201);
    expect(
      await prisma.reservation.findUnique({
        where: { id: restrictedReservation.body.id },
        select: { isCancelled: true },
      }),
    ).toEqual({ isCancelled: true });

    await request(server)
      .post("/admin/reservations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: otherRegistration.body.user.id,
        officeId,
        tableNumber: 12,
        reservationDate: startsOn,
      })
      .expect(409, {
        statusCode: 409,
        message:
          "This user has an active restriction for the selected date. Remove the restriction before continuing.",
      });

    const notifications = await request(server)
      .get("/notifications/me")
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(200);
    expect(notifications.body.length).toBeGreaterThan(0);

    await request(server)
      .patch(`/admin/users/${assignedRegistration.body.user.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);
    await request(server)
      .get("/auth/me")
      .set("Authorization", `Bearer ${assignedToken}`)
      .expect(401, {
        statusCode: 401,
        message: "Your account is inactive. Please contact the system administrator.",
      });
  });
});
