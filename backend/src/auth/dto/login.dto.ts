import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  @IsEmail({}, { message: "Geçerli bir e-posta adresi giriniz." })
  email!: string;

  @ApiProperty({ example: "GucluParola1!" })
  @IsString({ message: "Parolanızı giriniz." })
  @IsNotEmpty({ message: "Parolanızı giriniz." })
  password!: string;
}
