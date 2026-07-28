import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Ayşe Yılmaz" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ example: "+905551112233" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: "phone geçerli bir telefon numarası olmalıdır.",
  })
  phone?: string;
}
