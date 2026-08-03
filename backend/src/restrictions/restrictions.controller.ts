import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("restrictions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("restrictions")
export class RestrictionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.userRestriction.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        startsOn: true,
        endsOn: true,
        reason: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
