import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { ReservationResponseDto } from "./dto/reservation-response.dto";
import { UpdateReservationDto } from "./dto/update-reservation.dto";
import { ReservationsService } from "./reservations.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags("reservations")
@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiCreatedResponse({
    description: "Creates a reservation for the authenticated user.",
    type: ReservationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "The session is missing, invalid, or expired.",
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(user.userId, dto);
  }

  @Get("me")
  @ApiOkResponse({
    description: "Returns the authenticated user's reservations.",
    type: ReservationResponseDto,
    isArray: true,
  })
  findMyReservations(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findMyReservations(user.userId);
  }

  @Patch(":id")
  @ApiOkResponse({
    description: "Updates the authenticated user's reservation.",
    type: ReservationResponseDto,
  })
  @ApiForbiddenResponse({
    description: "The reservation belongs to another user.",
  })
  @ApiNotFoundResponse({ description: "Reservation not found." })
  update(
    @Param(
      "id",
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new BadRequestException(
            "Please enter a valid reservation ID.",
          ),
      }),
    )
    id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, user.userId, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiNoContentResponse({
    description: "Deletes the reservation and makes the table available again.",
  })
  @ApiForbiddenResponse({
    description: "The reservation belongs to another user.",
  })
  @ApiNotFoundResponse({ description: "Reservation not found." })
  async remove(
    @Param(
      "id",
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new BadRequestException(
            "Please enter a valid reservation ID.",
          ),
      }),
    )
    id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.reservationsService.remove(id, user.userId);
  }
}
