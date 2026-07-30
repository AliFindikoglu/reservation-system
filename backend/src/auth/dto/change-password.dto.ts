import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";
import {
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
} from "../../common/validation/password-policy";

export class ChangePasswordDto {
  @ApiProperty({ example: "GucluParola1!" })
  @IsString({ message: "Please enter your current password." })
  @IsNotEmpty({ message: "Please enter your current password." })
  currentPassword!: string;

  @ApiProperty({
    example: "YeniGucluParola2!",
    minLength: 8,
    description:
      "A password with no spaces that contains at least one uppercase letter, one lowercase letter, one number, and one symbol.",
  })
  @IsString({ message: PASSWORD_VALIDATION_MESSAGE })
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  newPassword!: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ example: "Your password has been changed successfully." })
  message!: string;
}
