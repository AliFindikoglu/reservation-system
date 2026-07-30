import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from "class-validator";
import {
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
} from "../../common/validation/password-policy";
import { IsCompanyEmail } from "../../common/validators/company-email.validator";

export class RegisterDto {
  @ApiProperty({ example: "Ayşe Yılmaz" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString({ message: "Please enter your full name." })
  @IsNotEmpty({ message: "Please enter your full name." })
  @Matches(/\S/, {
    message: "Please enter your full name.",
  })
  fullName!: string;

  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  @IsEmail({}, { message: "Please enter a valid email address." })
  @IsCompanyEmail({ message: "Please use your company email address." })
  email!: string;

  @ApiProperty({ example: "05061234215" })
  @Matches(/^05[0-9]{9}$/, {
    message: "Please enter an 11-digit phone number starting with 05.",
  })
  phone!: string;

  @ApiProperty({
    example: "GucluParola1!",
    minLength: 8,
    description:
      "A password with no spaces that contains at least one uppercase letter, one lowercase letter, one number, and one symbol.",
  })
  @IsString({ message: PASSWORD_VALIDATION_MESSAGE })
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  password!: string;
}
