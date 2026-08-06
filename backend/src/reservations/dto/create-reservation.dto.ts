import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsUUID, Matches, Max, Min } from "class-validator";

export class CreateReservationDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID("4", { message: "Please enter a valid office ID." })
  officeId!: string;

  @ApiProperty({ example: 12, minimum: 1, maximum: 32 })
  @IsInt({
    message: "Please enter a valid table number between 1 and 32.",
  })
  @Min(1, {
    message: "Please enter a valid table number between 1 and 32.",
  })
  @Max(32, {
    message: "Please enter a valid table number between 1 and 32.",
  })
  tableNumber!: number;

  @ApiProperty({ example: "2026-08-01" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter the reservation date in YYYY-MM-DD format.",
  })
  reservationDate!: string;
}
