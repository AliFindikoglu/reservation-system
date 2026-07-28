import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from "class-validator";
import { IsCompanyEmail } from "../../common/validators/company-email.validator";

export class RegisterDto {
  @ApiProperty({ example: "Ayşe Yılmaz" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  @IsEmail()
  @IsCompanyEmail()
  email!: string;

  @ApiProperty({ example: "+905551112233" })
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: "phone geçerli bir telefon numarası olmalıdır.",
  })
  phone!: string;

  @ApiProperty({ example: "gucluParola1", minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
