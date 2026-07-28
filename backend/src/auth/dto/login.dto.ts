import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "gucluParola1" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
