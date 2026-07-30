import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AvailableTablesQueryDto } from "./dto/available-tables-query.dto";
import { AvailableTablesResponseDto } from "./dto/available-tables-response.dto";
import { TableStatusesResponseDto } from "./dto/table-statuses-response.dto";
import { TablesService } from "./tables.service";

@ApiTags("tables")
@Controller("tables")
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get("available")
  @ApiOkResponse({
    description: "Table numbers available on the selected date.",
    type: AvailableTablesResponseDto,
  })
  findAvailable(@Query() query: AvailableTablesQueryDto) {
    return this.tablesService.findAvailable(query.date);
  }

  @Get("statuses")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description:
      "Returns every table as available, reserved, or reserved by the authenticated user.",
    type: TableStatusesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "The session is missing, invalid, or expired.",
  })
  findStatuses(
    @Query() query: AvailableTablesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tablesService.findStatuses(query.date, user.userId);
  }
}
