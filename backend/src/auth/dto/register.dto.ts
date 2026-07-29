import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from "class-validator";
import { IsCompanyEmail } from "../../common/validators/company-email.validator";

export class RegisterDto {
  @ApiProperty({ example: "Ayşe Yılmaz" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString({ message: "Adınızı ve soyadınızı giriniz." })
  @IsNotEmpty({ message: "Adınızı ve soyadınızı giriniz." })
  @Matches(/\S/, {
    message: "Adınızı ve soyadınızı giriniz.",
  })
  fullName!: string;

  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  @IsEmail({}, { message: "Geçerli bir e-posta adresi giriniz." })
  @IsCompanyEmail({ message: "Şirket e-posta adresinizi giriniz." })
  email!: string;

  @ApiProperty({ example: "05061234215" })
  @Matches(/^05[0-9]{9}$/, {
    message: "05 ile başlayan 11 haneli bir telefon numarası giriniz.",
  })
  phone!: string;

  @ApiProperty({
    example: "GucluParola1!",
    minLength: 8,
    description:
      "En az bir büyük harf, küçük harf, sayı ve sembol içeren boşluksuz parola.",
  })
  @IsString({
    message:
      "En az 8 karakterli; büyük harf, küçük harf, sayı ve sembol içeren, boşluksuz bir parola giriniz.",
  })
  @Matches(
    /^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*\p{N})(?=.*[^\p{L}\p{N}\s])\S{8,}$/u,
    {
      message:
        "En az 8 karakterli; büyük harf, küçük harf, sayı ve sembol içeren, boşluksuz bir parola giriniz.",
    },
  )
  password!: string;
}
