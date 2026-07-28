import { ApiProperty } from "@nestjs/swagger";

export class ReservationResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "2026-08-01", format: "date" })
  reservationDate!: string;

  @ApiProperty({ example: 12, minimum: 1, maximum: 32 })
  tableNumber!: number;
}
