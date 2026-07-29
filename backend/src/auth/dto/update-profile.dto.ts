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
  @IsString({ message: "Adınızı ve soyadınızı giriniz." })
  @IsNotEmpty({ message: "Adınızı ve soyadınızı giriniz." })
  @Matches(/\S/, {
    message: "Adınızı ve soyadınızı giriniz.",
  })
  fullName?: string;

  @ApiPropertyOptional({ example: "05061234215" })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @Matches(/^05[0-9]{9}$/, {
    message: "05 ile başlayan 11 haneli bir telefon numarası giriniz.",
  })
  phone?: string;
}
