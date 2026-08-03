import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { AuthenticatedUser } from "./authenticated-user";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: AuthenticatedUser): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.userId);
    if (!user || user.isActive === false) {
      throw new UnauthorizedException(
        "Your account is inactive. Please contact the system administrator.",
      );
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
