import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TableAssignmentsService } from "./table-assignments.service";

@ApiTags("table-assignments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("table-assignments")
export class TableAssignmentsController {
  constructor(private readonly service: TableAssignmentsService) {}

  @Get("me")
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMine(user.userId);
  }
}
