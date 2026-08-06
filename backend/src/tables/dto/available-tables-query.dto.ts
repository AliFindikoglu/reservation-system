import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, Matches } from "class-validator";

export class AvailableTablesQueryDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID("4", { message: "Please enter a valid office ID." })
  officeId!: string;

  @ApiProperty({ example: "2026-08-01" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter the reservation date in YYYY-MM-DD format.",
  })
  date!: string;
}
