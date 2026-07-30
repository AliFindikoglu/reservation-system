import { ApiProperty } from "@nestjs/swagger";

export enum TableReservationStatus {
  Available = "available",
  Reserved = "reserved",
  Mine = "mine",
}

export class TableStatusDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 32 })
  number!: number;

  @ApiProperty({
    enum: TableReservationStatus,
    example: TableReservationStatus.Available,
  })
  status!: TableReservationStatus;
}

export class TableStatusesResponseDto {
  @ApiProperty({ example: "2026-08-01", format: "date" })
  date!: string;

  @ApiProperty({ type: [TableStatusDto] })
  tables!: TableStatusDto[];
}
