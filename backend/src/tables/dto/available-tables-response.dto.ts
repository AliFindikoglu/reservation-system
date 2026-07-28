import { ApiProperty } from "@nestjs/swagger";

export class AvailableTablesResponseDto {
  @ApiProperty({ example: "2026-08-01", format: "date" })
  date!: string;

  @ApiProperty({
    example: [1, 2, 4, 5],
    type: [Number],
    description: "Seçilen tarihte boş olan masa numaraları.",
  })
  tables!: number[];
}
