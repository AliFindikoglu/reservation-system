import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.create({
      fullName: dto.fullName.trim(),
      email,
      phone: dto.phone.trim(),
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(
      dto.email.trim().toLowerCase(),
    );
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(
        "Please check your email address and password.",
      );
    }
    if (user.isActive === false) {
      throw new UnauthorizedException(
        "Your account is inactive. Please contact the system administrator.",
      );
    }
    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        "Your user account could not be found. Please contact the system administrator.",
      );
    }
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      preferredOfficeId: user.preferredOfficeId,
      preferredOffice: user.preferredOffice,
      themePreference: user.themePreference,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (
      dto.fullName === undefined &&
      dto.phone === undefined &&
      dto.preferredOfficeId === undefined &&
      dto.themePreference === undefined
    ) {
      throw new BadRequestException(
        "Please provide at least one profile or preference field to update.",
      );
    }

    const user = await this.usersService.updateProfile(userId, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
      ...(dto.preferredOfficeId !== undefined
        ? { preferredOfficeId: dto.preferredOfficeId }
        : {}),
      ...(dto.themePreference !== undefined
        ? { themePreference: dto.themePreference }
        : {}),
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      preferredOfficeId: user.preferredOfficeId,
      preferredOffice: user.preferredOffice,
      themePreference: user.themePreference,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        "Your user account could not be found. Please contact the system administrator.",
      );
    }

    const currentPasswordIsValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordIsValid) {
      throw new UnauthorizedException(
        "The current password is incorrect.",
      );
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        "The new password must be different from the current password.",
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePasswordHash(userId, passwordHash);

    return {
      message: "Your password has been changed successfully.",
    };
  }

  private buildAuthResponse(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: "USER" | "ADMIN";
    isActive: boolean;
    preferredOfficeId: string | null;
    preferredOffice: { id: string; name: string; city: string } | null;
    themePreference: "LIGHT" | "DARK";
  }) {
    return {
      accessToken: this.jwtService.sign({ userId: user.id, email: user.email }),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        preferredOfficeId: user.preferredOfficeId,
        preferredOffice: user.preferredOffice,
        themePreference: user.themePreference,
      },
    };
  }
}
