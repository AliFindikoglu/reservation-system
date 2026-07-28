import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";

export class AvailableTablesQueryDto {
  @ApiProperty({ example: "2026-08-01" })
  @IsDateString()
  date!: string;
}
