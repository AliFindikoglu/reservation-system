import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID, Matches } from "class-validator";

export enum AdminReservationStatusFilter {
  Active = "ACTIVE",
  Cancelled = "CANCELLED",
  All = "ALL",
}

export class AdminReservationsQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID("4", { message: "Please enter a valid office ID." })
  officeId?: string;

  @ApiPropertyOptional({ example: "Istanbul" })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID("4", { message: "Please enter a valid user ID." })
  userId?: string;

  @ApiPropertyOptional({ example: "2026-08-01" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter the start date in YYYY-MM-DD format.",
  })
  startsOn?: string;

  @ApiPropertyOptional({ example: "2026-08-31" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter the end date in YYYY-MM-DD format.",
  })
  endsOn?: string;

  @ApiPropertyOptional({
    enum: AdminReservationStatusFilter,
    default: AdminReservationStatusFilter.All,
  })
  @IsOptional()
  @IsEnum(AdminReservationStatusFilter, {
    message: "Please enter ACTIVE, CANCELLED, or ALL as the reservation status.",
  })
  status?: AdminReservationStatusFilter;
}
