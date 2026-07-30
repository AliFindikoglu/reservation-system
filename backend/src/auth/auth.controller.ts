import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthenticatedUser } from "./authenticated-user";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthResponseDto, UserResponseDto } from "./dto/user-response.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiCreatedResponse({
    description: "Creates a user and returns a JWT access token.",
    type: AuthResponseDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: "Returns a JWT access token for valid credentials.",
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "The email address or password is incorrect.",
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: "Returns the authenticated user's profile.",
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "The session is missing, invalid, or expired.",
  })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description:
      "Updates the authenticated user's full name and/or phone number.",
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Field validation failed or an unsupported field, such as email, was provided.",
  })
  @ApiUnauthorizedResponse({
    description: "The session is missing, invalid, or expired.",
  })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }
}
