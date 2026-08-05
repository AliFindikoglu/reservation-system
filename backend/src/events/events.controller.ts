import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateEventReviewDto, UpdateEventReviewDto } from "./dto/event-review.dto";
import { CreateEventSuggestionDto } from "./dto/event-suggestion.dto";
import { EventsQueryDto } from "./dto/events-query.dto";
import { EventsService } from "./events.service";

@ApiTags("events")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findEvents(@Query() query: EventsQueryDto) {
    return this.eventsService.findEvents(query);
  }

  @Post("suggestions")
  createSuggestion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEventSuggestionDto,
  ) {
    return this.eventsService.createSuggestion(user.userId, dto);
  }

  @Get(":id")
  findEventById(@Param("id", ParseUUIDPipe) id: string) {
    return this.eventsService.findEventById(id);
  }

  @Post(":id/reviews")
  createReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateEventReviewDto,
  ) {
    return this.eventsService.createReview(user.userId, id, dto);
  }

  @Patch(":id/reviews/me")
  updateMyReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventReviewDto,
  ) {
    return this.eventsService.updateReview(user.userId, id, dto);
  }

  @Delete(":id/reviews/me")
  deleteMyReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.eventsService.deleteReview(user.userId, id);
  }
}
