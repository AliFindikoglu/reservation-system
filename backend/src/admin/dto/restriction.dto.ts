import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, IsUUID, Matches } from "class-validator";

export class CreateRestrictionDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID("4", { message: "Please enter a valid user ID." })
  userId!: string;

  @ApiProperty({ example: "2026-08-10" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the start date in YYYY-MM-DD format." })
  startsOn!: string;

  @ApiProperty({ example: "2026-08-20" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the end date in YYYY-MM-DD format." })
  endsOn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid reason." })
  reason?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: "Please enter a valid confirmation value." })
  confirmImpact?: boolean;
}

export class UpdateRestrictionDto {
  @ApiPropertyOptional({ example: "2026-08-10" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the start date in YYYY-MM-DD format." })
  startsOn?: string;

  @ApiPropertyOptional({ example: "2026-08-20" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter the end date in YYYY-MM-DD format." })
  endsOn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid reason." })
  reason?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: "Please enter a valid confirmation value." })
  confirmImpact?: boolean;
}

export class RevokeRestrictionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid revocation reason." })
  reason?: string;
}
