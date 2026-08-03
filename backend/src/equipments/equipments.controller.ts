import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EquipmentListResponseDto } from "./dto/equipment-response.dto";
import { EquipmentsService } from "./equipments.service";

@ApiTags("equipments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("equipments")
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @Get()
  @ApiOkResponse({ type: EquipmentListResponseDto })
  findAll() {
    return this.equipmentsService.findAllActive();
  }
}
