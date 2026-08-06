import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  @IsEmail({}, { message: "Please enter a valid email address." })
  email!: string;

  @ApiProperty({ example: "GucluParola1!" })
  @IsString({ message: "Please enter your password." })
  @IsNotEmpty({ message: "Please enter your password." })
  password!: string;
}
