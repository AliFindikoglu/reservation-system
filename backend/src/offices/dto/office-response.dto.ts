import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OfficeResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Istanbul Office" })
  name!: string;

  @ApiProperty({ example: "Istanbul" })
  city!: string;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;
}
