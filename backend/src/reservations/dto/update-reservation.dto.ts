import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  Matches,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

export class UpdateReservationDto {
  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 32 })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt({
    message: "Please enter a valid table number between 1 and 32.",
  })
  @Min(1, {
    message: "Please enter a valid table number between 1 and 32.",
  })
  @Max(32, {
    message: "Please enter a valid table number between 1 and 32.",
  })
  tableNumber?: number;

  @ApiPropertyOptional({ example: "2026-08-01" })
  @ValidateIf((_, value) => value !== undefined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter the reservation date in YYYY-MM-DD format.",
  })
  reservationDate?: string;
}
