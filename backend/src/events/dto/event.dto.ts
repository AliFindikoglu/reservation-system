import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateEventDto {
  @ApiProperty({ example: "TypeScript Workshop" })
  @IsString({ message: "Please enter a valid event title." })
  @MinLength(3, { message: "The event title must contain at least 3 characters." })
  @MaxLength(160, { message: "The event title cannot exceed 160 characters." })
  title!: string;

  @ApiProperty()
  @IsString({ message: "Please enter a valid event description." })
  @MinLength(3, { message: "The event description must contain at least 3 characters." })
  @MaxLength(5000, { message: "The event description cannot exceed 5000 characters." })
  description!: string;

  @ApiProperty({ example: "2026-09-15T09:00:00+03:00" })
  @IsISO8601({}, { message: "Please enter a valid event start date and time." })
  startsAt!: string;

  @ApiProperty({ example: "2026-09-15T17:00:00+03:00" })
  @IsISO8601({}, { message: "Please enter a valid event end date and time." })
  endsAt!: string;

  @ApiProperty({ example: "ITU ARI 3 Conference Hall" })
  @IsString({ message: "Please enter a valid event location." })
  @MinLength(2, { message: "The event location must contain at least 2 characters." })
  @MaxLength(300, { message: "The event location cannot exceed 300 characters." })
  location!: string;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class CancelEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "Please enter a valid cancellation reason." })
  @MaxLength(1000, { message: "The cancellation reason cannot exceed 1000 characters." })
  reason?: string;
}
