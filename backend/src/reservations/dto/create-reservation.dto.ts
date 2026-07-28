import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Matches, Max, Min } from "class-validator";

export class CreateReservationDto {
  @ApiProperty({ example: 12, minimum: 1, maximum: 32 })
  @IsInt()
  @Min(1)
  @Max(32)
  tableNumber!: number;

  @ApiProperty({ example: "2026-08-01" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "reservationDate YYYY-MM-DD formatında olmalıdır.",
  })
  reservationDate!: string;
}
