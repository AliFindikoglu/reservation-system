import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventSuggestionStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CancelEventDto,
  CreateEventDto,
  UpdateEventDto,
} from "./dto/event.dto";
import {
  AcceptEventSuggestionDto,
  CreateEventSuggestionDto,
  RejectEventSuggestionDto,
} from "./dto/event-suggestion.dto";
import {
  CreateEventReviewDto,
  UpdateEventReviewDto,
} from "./dto/event-review.dto";
import { EventListScope, EventsQueryDto } from "./dto/events-query.dto";

type Tx = Prisma.TransactionClient;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findEvents(query: EventsQueryDto) {
    const now = new Date();
    const scope = query.scope ?? EventListScope.Upcoming;
    const events = await this.prisma.event.findMany({
      where: {
        isCancelled: false,
        ...(scope === EventListScope.Upcoming
          ? { endsAt: { gte: now } }
          : scope === EventListScope.Past
            ? { endsAt: { lt: now } }
            : {}),
      },
      include: {
        reviews: {
          where: { isDeleted: false },
          select: { rating: true },
        },
      },
      orderBy: { startsAt: scope === EventListScope.Past ? "desc" : "asc" },
    });
    return events.map((event) => this.eventSummary(event));
  }

  async findEventById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, isCancelled: false },
      include: {
        reviews: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!event) throw new NotFoundException("Event not found.");
    const ratings = event.reviews.map((review) => review.rating);
    return {
      ...this.eventBase(event),
      ratingSummary: this.ratingSummary(ratings),
      reviews: event.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };
  }

  async createSuggestion(userId: string, dto: CreateEventSuggestionDto) {
    const suggestionText = dto.suggestionText.trim();
    const normalizedText = this.normalizeSuggestion(suggestionText);
    const existing = await this.prisma.eventSuggestion.findFirst({
      where: {
        userId,
        normalizedText,
        status: EventSuggestionStatus.PENDING,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("This event suggestion already exists.");
    }
    try {
      await this.prisma.eventSuggestion.create({
        data: { userId, suggestionText, normalizedText },
      });
      return { message: "Your event suggestion has been submitted successfully." };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException("This event suggestion already exists.");
      }
      throw error;
    }
  }

  async createReview(
    userId: string,
    eventId: string,
    dto: CreateEventReviewDto,
  ) {
    await this.assertEventReviewable(eventId);
    const existing = await this.prisma.eventReview.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing && !existing.isDeleted) {
      throw new ConflictException("You have already reviewed this event.");
    }
    const data = {
      rating: dto.rating,
      comment: this.cleanOptionalText(dto.comment),
      isDeleted: false,
      deletedAt: null,
      deletedByAdminId: null,
    };
    return existing
      ? this.prisma.eventReview.update({ where: { id: existing.id }, data })
      : this.prisma.eventReview.create({
          data: { eventId, userId, ...data },
        });
  }

  async updateReview(
    userId: string,
    eventId: string,
    dto: UpdateEventReviewDto,
  ) {
    if (dto.rating === undefined && dto.comment === undefined) {
      throw new BadRequestException(
        "Please provide a rating or comment to update.",
      );
    }
    await this.assertEventReviewable(eventId);
    const review = await this.prisma.eventReview.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!review || review.isDeleted) {
      throw new NotFoundException("Event review not found.");
    }
    return this.prisma.eventReview.update({
      where: { id: review.id },
      data: {
        ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
        ...(dto.comment !== undefined
          ? { comment: this.cleanOptionalText(dto.comment) }
          : {}),
      },
    });
  }

  async deleteReview(userId: string, eventId: string) {
    const review = await this.prisma.eventReview.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!review || review.isDeleted) {
      throw new NotFoundException("Event review not found.");
    }
    await this.prisma.eventReview.update({
      where: { id: review.id },
      data: { isDeleted: true, deletedAt: new Date(), deletedByAdminId: null },
    });
    return { message: "Your event review has been deleted successfully." };
  }

  findAdminEvents() {
    return this.prisma.event.findMany({
      include: {
        createdByAdmin: { select: { id: true, fullName: true, email: true } },
        sourceSuggestion: {
          select: { id: true, suggestionText: true, userId: true },
        },
        _count: { select: { reviews: { where: { isDeleted: false } } } },
      },
      orderBy: { startsAt: "desc" },
    });
  }

  async createEvent(adminUserId: string, dto: CreateEventDto) {
    const data = this.eventData(dto);
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: { ...data, createdByAdminId: adminUserId },
      });
      await this.createAudit(tx, adminUserId, "CREATE_EVENT", event.id, data);
      return event;
    });
  }

  async updateEvent(adminUserId: string, id: string, dto: UpdateEventDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Please provide an event field to update.");
    }
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Event not found.");
    if (existing.isCancelled) {
      throw new BadRequestException("Cancelled events cannot be modified.");
    }
    const complete = {
      title: dto.title ?? existing.title,
      description: dto.description ?? existing.description,
      startsAt: dto.startsAt ?? existing.startsAt.toISOString(),
      endsAt: dto.endsAt ?? existing.endsAt.toISOString(),
      location: dto.location ?? existing.location,
    };
    const data = this.eventData(complete);
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.update({ where: { id }, data });
      await this.createAudit(tx, adminUserId, "UPDATE_EVENT", id, data, {
        title: existing.title,
        description: existing.description,
        startsAt: existing.startsAt.toISOString(),
        endsAt: existing.endsAt.toISOString(),
        location: existing.location,
      });
      return event;
    });
  }

  async cancelEvent(adminUserId: string, id: string, dto: CancelEventDto) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Event not found.");
    if (existing.isCancelled) {
      throw new ConflictException("This event is already cancelled.");
    }
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id },
        data: {
          isCancelled: true,
          cancelledAt: new Date(),
          cancelledByAdminId: adminUserId,
          cancellationReason: this.cleanOptionalText(dto.reason),
        },
      });
      await this.createAudit(
        tx,
        adminUserId,
        "CANCEL_EVENT",
        id,
        { isCancelled: true },
        { isCancelled: false },
        dto.reason,
      );
      return { message: "The event has been cancelled successfully.", event };
    });
  }

  findSuggestions() {
    return this.prisma.eventSuggestion.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        reviewedByAdmin: {
          select: { id: true, fullName: true, email: true },
        },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptSuggestion(
    adminUserId: string,
    suggestionId: string,
    dto: AcceptEventSuggestionDto,
  ) {
    const data = this.eventData(dto);
    return this.prisma.$transaction(async (tx) => {
      const suggestion = await tx.eventSuggestion.findUnique({
        where: { id: suggestionId },
      });
      if (!suggestion) throw new NotFoundException("Event suggestion not found.");
      if (suggestion.status !== EventSuggestionStatus.PENDING) {
        throw new ConflictException("This event suggestion has already been reviewed.");
      }
      const event = await tx.event.create({
        data: {
          ...data,
          createdByAdminId: adminUserId,
          sourceSuggestionId: suggestion.id,
        },
      });
      await tx.eventSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: EventSuggestionStatus.ACCEPTED,
          reviewedByAdminId: adminUserId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });
      await tx.notification.create({
        data: {
          userId: suggestion.userId,
          type: "EVENT_SUGGESTION_ACCEPTED",
          title: "Event suggestion accepted",
          message: `Your event suggestion was accepted and the event “${event.title}” was created.`,
          relatedEntityType: "Event",
          relatedEntityId: event.id,
        },
      });
      await this.createAudit(
        tx,
        adminUserId,
        "ACCEPT_EVENT_SUGGESTION",
        suggestion.id,
        { status: EventSuggestionStatus.ACCEPTED, eventId: event.id },
        { status: EventSuggestionStatus.PENDING },
      );
      return event;
    });
  }

  async rejectSuggestion(
    adminUserId: string,
    suggestionId: string,
    dto: RejectEventSuggestionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const suggestion = await tx.eventSuggestion.findUnique({
        where: { id: suggestionId },
      });
      if (!suggestion) throw new NotFoundException("Event suggestion not found.");
      if (suggestion.status !== EventSuggestionStatus.PENDING) {
        throw new ConflictException("This event suggestion has already been reviewed.");
      }
      const reason = dto.reason.trim();
      const updated = await tx.eventSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: EventSuggestionStatus.REJECTED,
          reviewedByAdminId: adminUserId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });
      await tx.notification.create({
        data: {
          userId: suggestion.userId,
          type: "EVENT_SUGGESTION_REJECTED",
          title: "Event suggestion rejected",
          message: `Your event suggestion was rejected. Reason: ${reason}`,
          relatedEntityType: "EventSuggestion",
          relatedEntityId: suggestion.id,
        },
      });
      await this.createAudit(
        tx,
        adminUserId,
        "REJECT_EVENT_SUGGESTION",
        suggestion.id,
        { status: EventSuggestionStatus.REJECTED, rejectionReason: reason },
        { status: EventSuggestionStatus.PENDING },
        reason,
      );
      return updated;
    });
  }

  async deleteReviewAsAdmin(adminUserId: string, reviewId: string) {
    const review = await this.prisma.eventReview.findUnique({
      where: { id: reviewId },
    });
    if (!review || review.isDeleted) {
      throw new NotFoundException("Event review not found.");
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.eventReview.update({
        where: { id: review.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedByAdminId: adminUserId,
        },
      });
      await this.createAudit(
        tx,
        adminUserId,
        "DELETE_EVENT_REVIEW",
        review.id,
        { isDeleted: true },
        { isDeleted: false },
      );
      return { message: "The event review has been deleted successfully." };
    });
  }

  private async assertEventReviewable(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found.");
    if (event.isCancelled) {
      throw new ForbiddenException("Cancelled events cannot be reviewed.");
    }
    if (event.endsAt > new Date()) {
      throw new ForbiddenException(
        "This event can be reviewed only after it has ended.",
      );
    }
    return event;
  }

  private eventData(dto: CreateEventDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException(
        "The event end date and time must be after the start date and time.",
      );
    }
    return {
      title: dto.title.trim(),
      description: dto.description.trim(),
      startsAt,
      endsAt,
      location: dto.location.trim(),
    };
  }

  private eventBase(event: {
    id: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    location: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private eventSummary(event: {
    id: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    location: string;
    createdAt: Date;
    updatedAt: Date;
    reviews: { rating: number }[];
  }) {
    return {
      ...this.eventBase(event),
      ratingSummary: this.ratingSummary(
        event.reviews.map((review) => review.rating),
      ),
    };
  }

  private ratingSummary(ratings: number[]) {
    return {
      average: ratings.length
        ? Number(
            (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2),
          )
        : null,
      count: ratings.length,
    };
  }

  private normalizeSuggestion(value: string) {
    return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
  }

  private cleanOptionalText(value?: string | null) {
    if (value === undefined || value === null) return null;
    return value.trim() || null;
  }

  private createAudit(
    tx: Tx,
    adminUserId: string,
    action: string,
    targetId: string,
    newValue: Prisma.InputJsonValue,
    oldValue?: Prisma.InputJsonValue,
    reason?: string,
  ) {
    return tx.adminAuditLog.create({
      data: {
        adminUserId,
        action,
        targetType: action.includes("REVIEW")
          ? "EventReview"
          : action.includes("SUGGESTION")
            ? "EventSuggestion"
            : "Event",
        targetId,
        oldValue,
        newValue,
        reason: this.cleanOptionalText(reason),
      },
    });
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
