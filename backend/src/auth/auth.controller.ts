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
    description: "Kullanıcı oluşturulur ve JWT access token döner.",
    type: AuthResponseDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: "Geçerli bilgiler için JWT access token döner.",
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "E-posta adresi veya parola hatalıdır.",
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: "Giriş yapan kullanıcının profil bilgileri.",
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Oturum bilgisi eksik, geçersiz veya süresi dolmuştur.",
  })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description:
      "Giriş yapan kullanıcının adı ve/veya telefon numarası güncellenir.",
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Alan doğrulaması başarısız veya e-posta gibi değiştirilemeyen bir alan gönderildi.",
  })
  @ApiUnauthorizedResponse({
    description: "Oturum bilgisi eksik, geçersiz veya süresi dolmuştur.",
  })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }
}
