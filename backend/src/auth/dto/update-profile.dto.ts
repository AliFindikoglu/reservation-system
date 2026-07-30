import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  Matches,
  ValidateIf,
} from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Ayşe Yılmaz" })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString({ message: "Please enter your full name." })
  @IsNotEmpty({ message: "Please enter your full name." })
  @Matches(/\S/, {
    message: "Please enter your full name.",
  })
  fullName?: string;

  @ApiPropertyOptional({ example: "05061234215" })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @Matches(/^05[0-9]{9}$/, {
    message: "Please enter an 11-digit phone number starting with 05.",
  })
  phone?: string;
}
