import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
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
      throw new UnauthorizedException("E-posta veya parola hatalı.");
    }
    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Kullanıcı bulunamadı.");
    }
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.fullName === undefined && dto.phone === undefined) {
      throw new BadRequestException(
        "fullName veya phone alanlarından en az biri gönderilmelidir.",
      );
    }

    const user = await this.usersService.updateProfile(userId, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    };
  }

  private buildAuthResponse(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  }) {
    return {
      accessToken: this.jwtService.sign({ userId: user.id, email: user.email }),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    };
  }
}
