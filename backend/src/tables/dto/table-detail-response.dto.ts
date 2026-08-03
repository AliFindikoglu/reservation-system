import { ApiProperty } from "@nestjs/swagger";
import { EquipmentResponseDto } from "../../equipments/dto/equipment-response.dto";

export class TableDetailResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ example: "A1" })
  code!: string;

  @ApiProperty({ type: [EquipmentResponseDto] })
  equipments!: EquipmentResponseDto[];
}
