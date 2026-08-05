import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { OfficeResponseDto } from "./dto/office-response.dto";
import { OfficesService } from "./offices.service";

@ApiTags("offices")
@Controller("offices")
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Get()
  @ApiOkResponse({ type: OfficeResponseDto, isArray: true })
  findAll() {
    return this.officesService.findAll();
  }

  @Get(":id")
  @ApiOkResponse({ type: OfficeResponseDto })
  @ApiNotFoundResponse({ description: "Office not found." })
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.officesService.findById(id);
  }
}
