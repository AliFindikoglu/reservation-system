import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserRole } from "@prisma/client";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { ApiExceptionFilter } from "../src/common/filters/api-exception.filter";
import { createValidationPipe } from "../src/common/validation/create-validation-pipe";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Events, suggestions, reviews, and moderation (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const password = "GucluParola1!";
  const adminEmail = "events.admin.e2e@eteration.com";
  const userEmail = "events.user.e2e@eteration.com";

  async function cleanup() {
    const users = await prisma.user.findMany({
      where: { email: { in: [adminEmail, userEmail] } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    const suggestions = userIds.length
      ? await prisma.eventSuggestion.findMany({
          where: {
            OR: [
              { userId: { in: userIds } },
              { reviewedByAdminId: { in: userIds } },
            ],
          },
          select: { id: true },
        })
      : [];
    const events = userIds.length
      ? await prisma.event.findMany({
          where: {
            OR: [
              { createdByAdminId: { in: userIds } },
              { cancelledByAdminId: { in: userIds } },
            ],
          },
          select: { id: true },
        })
      : [];
    const eventIds = events.map((event) => event.id);
    const suggestionIds = suggestions.map((suggestion) => suggestion.id);
    if (eventIds.length) {
      await prisma.eventReview.deleteMany({ where: { eventId: { in: eventIds } } });
      await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
    }
    if (suggestionIds.length) {
      await prisma.eventSuggestion.deleteMany({
        where: { id: { in: suggestionIds } },
      });
    }
    if (userIds.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.adminAuditLog.deleteMany({
        where: { adminUserId: { in: userIds } },
      });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
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

  it("manages text suggestions, event publication, review lifecycle, and moderation", async () => {
    const server = app.getHttpServer();
    const adminRegistration = await request(server)
      .post("/auth/register")
      .send({
        fullName: "Events Admin",
        email: adminEmail,
        phone: "05067770001",
        password,
      })
      .expect(201);
    const userRegistration = await request(server)
      .post("/auth/register")
      .send({
        fullName: "Events User",
        email: userEmail,
        phone: "05067770002",
        password,
      })
      .expect(201);
    await prisma.user.update({
      where: { id: adminRegistration.body.user.id },
      data: { role: UserRole.ADMIN },
    });
    const adminToken = adminRegistration.body.accessToken as string;
    const userToken = userRegistration.body.accessToken as string;
    const suggestionText = "A practical TypeScript workshop would be useful.";

    await request(server)
      .post("/events/suggestions")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ suggestionText })
      .expect(201, {
        message: "Your event suggestion has been submitted successfully.",
      });
    await request(server)
      .post("/events/suggestions")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ suggestionText: `  ${suggestionText.toUpperCase()}  ` })
      .expect(409, {
        statusCode: 409,
        message: "This event suggestion already exists.",
      });

    await request(server)
      .get("/admin/event-suggestions")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(403);
    const suggestions = await request(server)
      .get("/admin/event-suggestions")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const suggestion = suggestions.body.find(
      (item: { suggestionText: string }) => item.suggestionText === suggestionText,
    );
    expect(suggestion.user).toMatchObject({
      id: userRegistration.body.user.id,
      fullName: "Events User",
    });

    const startsAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const acceptedEvent = await request(server)
      .post(`/admin/event-suggestions/${suggestion.id}/accept`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "TypeScript Workshop",
        description: "A practical workshop.",
        startsAt,
        endsAt,
        location: "ITU ARI 3 Conference Hall",
      })
      .expect(201);
    expect(acceptedEvent.body.sourceSuggestionId).toBe(suggestion.id);
    await request(server)
      .post(`/admin/event-suggestions/${suggestion.id}/accept`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Duplicate Workshop",
        description: "Should not be created.",
        startsAt,
        endsAt,
        location: "Meeting Room",
      })
      .expect(409, {
        statusCode: 409,
        message: "This event suggestion has already been reviewed.",
      });

    const notifications = await request(server)
      .get("/notifications/me")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    expect(notifications.body).toContainEqual(
      expect.objectContaining({ type: "EVENT_SUGGESTION_ACCEPTED" }),
    );

    await request(server)
      .post("/events/suggestions")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ suggestionText: "A company photography day could be organized." })
      .expect(201);
    const suggestionsAfterSecondSubmit = await request(server)
      .get("/admin/event-suggestions")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const rejectedSuggestion = suggestionsAfterSecondSubmit.body.find(
      (item: { suggestionText: string }) =>
        item.suggestionText === "A company photography day could be organized.",
    );
    await request(server)
      .post(`/admin/event-suggestions/${rejectedSuggestion.id}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "The current event calendar is full." })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: "REJECTED",
          rejectionReason: "The current event calendar is full.",
        });
      });
    const notificationsAfterRejection = await request(server)
      .get("/notifications/me")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    expect(notificationsAfterRejection.body).toContainEqual(
      expect.objectContaining({
        type: "EVENT_SUGGESTION_REJECTED",
        message:
          "Your event suggestion was rejected. Reason: The current event calendar is full.",
      }),
    );

    const review = await request(server)
      .post(`/events/${acceptedEvent.body.id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5 })
      .expect(201);
    expect(review.body).toMatchObject({ rating: 5, comment: null });
    await request(server)
      .post(`/events/${acceptedEvent.body.id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 4, comment: "Very useful." })
      .expect(409, {
        statusCode: 409,
        message: "You have already reviewed this event.",
      });
    await request(server)
      .patch(`/events/${acceptedEvent.body.id}/reviews/me`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 4, comment: "Very useful." })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({ rating: 4, comment: "Very useful." });
      });
    await request(server)
      .delete(`/events/${acceptedEvent.body.id}/reviews/me`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    const restoredReview = await request(server)
      .post(`/events/${acceptedEvent.body.id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 3, comment: "Submitted again." })
      .expect(201);
    expect(restoredReview.body.id).toBe(review.body.id);

    await request(server)
      .delete(`/admin/event-reviews/${review.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    await request(server)
      .post(`/events/${acceptedEvent.body.id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5, comment: "Recreated after moderation." })
      .expect(201);

    const futureEvent = await request(server)
      .post("/admin/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Future Event",
        description: "This event has not ended yet.",
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: "Izmir Meeting Hall",
      })
      .expect(201);
    await request(server)
      .post(`/events/${futureEvent.body.id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5 })
      .expect(403, {
        statusCode: 403,
        message: "This event can be reviewed only after it has ended.",
      });
    await request(server)
      .delete(`/admin/events/${futureEvent.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Schedule changed" })
      .expect(200);
  });
});
