import { ApiProperty } from "@nestjs/swagger";
import { ThemePreference, UserRole } from "@prisma/client";

export class PreferredOfficeResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Istanbul Office" })
  name!: string;

  @ApiProperty({ example: "Istanbul" })
  city!: string;
}

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

  @ApiProperty({ format: "uuid", nullable: true })
  preferredOfficeId!: string | null;

  @ApiProperty({ type: PreferredOfficeResponseDto, nullable: true })
  preferredOffice!: PreferredOfficeResponseDto | null;

  @ApiProperty({ enum: ThemePreference, example: ThemePreference.LIGHT })
  themePreference!: ThemePreference;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "JWT used in the Authorization: Bearer <token> header.",
  })
  accessToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
