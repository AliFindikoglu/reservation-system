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
    description: "Giriş yapan kullanıcı için rezervasyon oluşturulur.",
    type: ReservationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Oturum bilgisi eksik, geçersiz veya süresi dolmuştur.",
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(user.userId, dto);
  }

  @Get("me")
  @ApiOkResponse({
    description: "Giriş yapan kullanıcının rezervasyonları.",
    type: ReservationResponseDto,
    isArray: true,
  })
  findMyReservations(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findMyReservations(user.userId);
  }

  @Patch(":id")
  @ApiOkResponse({
    description: "Kullanıcının kendi rezervasyonu güncellenir.",
    type: ReservationResponseDto,
  })
  @ApiForbiddenResponse({
    description: "Rezervasyon başka bir kullanıcıya ait.",
  })
  @ApiNotFoundResponse({ description: "Rezervasyon bulunamadı." })
  update(
    @Param(
      "id",
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new BadRequestException(
            "Geçerli bir rezervasyon kimliği giriniz.",
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
    description: "Rezervasyon silinir ve masa tekrar kullanılabilir olur.",
  })
  @ApiForbiddenResponse({
    description: "Rezervasyon başka bir kullanıcıya ait.",
  })
  @ApiNotFoundResponse({ description: "Rezervasyon bulunamadı." })
  async remove(
    @Param(
      "id",
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new BadRequestException(
            "Geçerli bir rezervasyon kimliği giriniz.",
          ),
      }),
    )
    id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.reservationsService.remove(id, user.userId);
  }
}
