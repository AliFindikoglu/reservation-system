import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";

export class AvailableTablesQueryDto {
  @ApiProperty({ example: "2026-08-01" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter the reservation date in YYYY-MM-DD format.",
  })
  date!: string;
}
