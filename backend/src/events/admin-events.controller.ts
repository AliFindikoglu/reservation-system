import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CancelEventDto, CreateEventDto, UpdateEventDto } from "./dto/event.dto";
import {
  AcceptEventSuggestionDto,
  RejectEventSuggestionDto,
} from "./dto/event-suggestion.dto";
import { EventsService } from "./events.service";

@ApiTags("admin-events")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get("events")
  findEvents() {
    return this.eventsService.findAdminEvents();
  }

  @Post("events")
  createEvent(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.createEvent(admin.userId, dto);
  }

  @Patch("events/:id")
  updateEvent(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(admin.userId, id, dto);
  }

  @Delete("events/:id")
  cancelEvent(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CancelEventDto,
  ) {
    return this.eventsService.cancelEvent(admin.userId, id, dto);
  }

  @Get("event-suggestions")
  findSuggestions() {
    return this.eventsService.findSuggestions();
  }

  @Post("event-suggestions/:id/accept")
  acceptSuggestion(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AcceptEventSuggestionDto,
  ) {
    return this.eventsService.acceptSuggestion(admin.userId, id, dto);
  }

  @Post("event-suggestions/:id/reject")
  rejectSuggestion(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RejectEventSuggestionDto,
  ) {
    return this.eventsService.rejectSuggestion(admin.userId, id, dto);
  }

  @Delete("event-reviews/:id")
  deleteReview(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.eventsService.deleteReviewAsAdmin(admin.userId, id);
  }
}
