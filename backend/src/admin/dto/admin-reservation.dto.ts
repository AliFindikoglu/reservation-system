import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from "class-validator";

export class AdminReservationDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID("4", { message: "Please enter a valid user ID." })
  userId!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID("4", { message: "Please enter a valid office ID." })
  officeId!: string;

  @ApiProperty({ minimum: 1, maximum: 32, example: 12 })
  @IsInt({ message: "Please enter a valid table number between 1 and 32." })
  @Min(1, { message: "Please enter a valid table number between 1 and 32." })
  @Max(32, { message: "Please enter a valid table number between 1 and 32." })
  tableNumber!: number;

  @ApiProperty({ example: "2026-08-10" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the reservation date in YYYY-MM-DD format." })
  reservationDate!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: "Please enter a valid confirmation value." })
  confirmOverride?: boolean;

  @ApiPropertyOptional({ example: "Operational requirement" })
  @IsOptional()
  @IsString({ message: "Please enter a valid reason." })
  reason?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 32 })
  @IsOptional()
  @IsInt({ message: "Please enter a valid replacement table number between 1 and 32." })
  @Min(1, { message: "Please enter a valid replacement table number between 1 and 32." })
  @Max(32, { message: "Please enter a valid replacement table number between 1 and 32." })
  replacementTableNumber?: number;
}

export class UpdateAdminReservationDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID("4", { message: "Please enter a valid user ID." })
  userId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID("4", { message: "Please enter a valid office ID." })
  officeId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 32 })
  @IsOptional()
  @IsInt({ message: "Please enter a valid table number between 1 and 32." })
  @Min(1, { message: "Please enter a valid table number between 1 and 32." })
  @Max(32, { message: "Please enter a valid table number between 1 and 32." })
  tableNumber?: number;

  @ApiPropertyOptional({ example: "2026-08-10" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the reservation date in YYYY-MM-DD format." })
  reservationDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: "Please enter a valid confirmation value." })
  confirmOverride?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid reason." })
  reason?: string;
}

export class CancelAdminReservationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid cancellation reason." })
  reason?: string;
}
