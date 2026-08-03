import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateEquipmentDto {
  @ApiProperty({ example: "Standing Desk Converter" })
  @IsString({ message: "Please enter a valid equipment name." })
  @MinLength(2, { message: "Equipment name must contain at least 2 characters." })
  @MaxLength(80, { message: "Equipment name cannot exceed 80 characters." })
  name!: string;

  @ApiProperty({ example: "STANDING_DESK_CONVERTER" })
  @Matches(/^[A-Z0-9_]+$/, {
    message: "Equipment code may contain only uppercase letters, numbers, and underscores.",
  })
  @MaxLength(80, { message: "Equipment code cannot exceed 80 characters." })
  code!: string;
}
