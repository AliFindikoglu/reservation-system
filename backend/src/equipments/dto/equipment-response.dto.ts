import { ApiProperty } from "@nestjs/swagger";

export class EquipmentResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "DOCK_STATION" })
  code!: string;

  @ApiProperty({ example: "Dock Station" })
  name!: string;
}

export class EquipmentListResponseDto {
  @ApiProperty({ type: [EquipmentResponseDto] })
  equipments!: EquipmentResponseDto[];
}
