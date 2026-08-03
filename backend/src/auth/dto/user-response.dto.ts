import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class UserResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Ayşe Yılmaz" })
  fullName!: string;

  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  email!: string;

  @ApiProperty({ example: "05061234215" })
  phone!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "JWT used in the Authorization: Bearer <token> header.",
  })
  accessToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
