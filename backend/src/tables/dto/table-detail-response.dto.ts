import { ApiProperty } from "@nestjs/swagger";
import { EquipmentResponseDto } from "../../equipments/dto/equipment-response.dto";

export class TableDetailResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ example: "A1" })
  code!: string;

  @ApiProperty({
    example: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Istanbul Office",
      city: "Istanbul",
    },
  })
  office!: { id: string; name: string; city: string };

  @ApiProperty({ type: [EquipmentResponseDto] })
  equipments!: EquipmentResponseDto[];
}
