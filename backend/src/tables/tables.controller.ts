import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AvailableTablesQueryDto } from "./dto/available-tables-query.dto";
import { AvailableTablesResponseDto } from "./dto/available-tables-response.dto";
import { TablesService } from "./tables.service";

@ApiTags("tables")
@Controller("tables")
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get("available")
  @ApiOkResponse({
    description: "Seçilen tarihte boş olan masa numaraları.",
    type: AvailableTablesResponseDto,
  })
  findAvailable(@Query() query: AvailableTablesQueryDto) {
    return this.tablesService.findAvailable(query.date);
  }
}
