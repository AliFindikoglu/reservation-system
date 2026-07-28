import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Ayşe Yılmaz" })
  fullName!: string;

  @ApiProperty({ example: "ayse.yilmaz@eteration.com" })
  email!: string;

  @ApiProperty({ example: "+905551112233" })
  phone!: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "Authorization: Bearer <token> başlığında kullanılacak JWT.",
  })
  accessToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
