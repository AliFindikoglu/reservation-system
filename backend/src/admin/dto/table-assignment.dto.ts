import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from "class-validator";

export class CreateTableAssignmentDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID("4", { message: "Please enter a valid user ID." })
  userId!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID("4", { message: "Please enter a valid office ID." })
  officeId!: string;

  @ApiProperty({ minimum: 1, maximum: 32 })
  @IsInt({ message: "Please enter a valid table number between 1 and 32." })
  @Min(1, { message: "Please enter a valid table number between 1 and 32." })
  @Max(32, { message: "Please enter a valid table number between 1 and 32." })
  tableNumber!: number;

  @ApiProperty({ example: "2026-08-10" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the start date in YYYY-MM-DD format." })
  startsOn!: string;

  @ApiPropertyOptional({ example: "2026-09-10", nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the end date in YYYY-MM-DD format." })
  endsOn?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: "Please enter a valid confirmation value." })
  confirmOverride?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid reason." })
  reason?: string;
}

export class UpdateAssignmentEndDateDto {
  @ApiPropertyOptional({ example: "2026-09-30", nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the end date in YYYY-MM-DD format." })
  endsOn?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: "Please enter a valid confirmation value." })
  confirmOverride?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid reason." })
  reason?: string;
}

export class RevokeAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid revocation reason." })
  reason?: string;
}
