import { ApiProperty } from "@nestjs/swagger";
import { EquipmentResponseDto } from "../../equipments/dto/equipment-response.dto";

export enum TableReservationStatus {
  Available = "available",
  Reserved = "reserved",
  Mine = "mine",
}

export class TableStatusDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 32 })
  number!: number;

  @ApiProperty({ example: "A1" })
  code!: string;

  @ApiProperty({
    enum: TableReservationStatus,
    example: TableReservationStatus.Available,
  })
  status!: TableReservationStatus;

  @ApiProperty({ type: [EquipmentResponseDto] })
  equipments!: EquipmentResponseDto[];
}

export class TableStatusesResponseDto {
  @ApiProperty({ example: "2026-08-01", format: "date" })
  date!: string;

  @ApiProperty({ type: [TableStatusDto] })
  tables!: TableStatusDto[];
}
