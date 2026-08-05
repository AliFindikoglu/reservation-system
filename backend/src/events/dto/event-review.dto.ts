import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateEventReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt({ message: "Please enter an integer rating between 1 and 5." })
  @Min(1, { message: "Please enter a rating between 1 and 5." })
  @Max(5, { message: "Please enter a rating between 1 and 5." })
  rating!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: "Please enter a valid review comment." })
  @MaxLength(2000, { message: "The review comment cannot exceed 2000 characters." })
  comment?: string | null;
}

export class UpdateEventReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt({ message: "Please enter an integer rating between 1 and 5." })
  @Min(1, { message: "Please enter a rating between 1 and 5." })
  @Max(5, { message: "Please enter a rating between 1 and 5." })
  rating?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: "Please enter a valid review comment." })
  @MaxLength(2000, { message: "The review comment cannot exceed 2000 characters." })
  comment?: string | null;
}
