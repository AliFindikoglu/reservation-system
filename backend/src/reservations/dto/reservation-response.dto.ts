import { ApiProperty } from "@nestjs/swagger";

export class ReservationResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "2026-08-01", format: "date" })
  reservationDate!: string;

  @ApiProperty({ example: 12, minimum: 1, maximum: 32 })
  tableNumber!: number;

  @ApiProperty({
    example: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Istanbul Office",
      city: "Istanbul",
    },
  })
  office!: { id: string; name: string; city: string };
}
