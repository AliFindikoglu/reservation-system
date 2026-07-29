import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Matches, Max, Min } from "class-validator";

export class CreateReservationDto {
  @ApiProperty({ example: 12, minimum: 1, maximum: 32 })
  @IsInt({
    message: "1 ile 32 arasında geçerli bir masa numarası giriniz.",
  })
  @Min(1, {
    message: "1 ile 32 arasında geçerli bir masa numarası giriniz.",
  })
  @Max(32, {
    message: "1 ile 32 arasında geçerli bir masa numarası giriniz.",
  })
  tableNumber!: number;

  @ApiProperty({ example: "2026-08-01" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Rezervasyon tarihini YYYY-MM-DD biçiminde giriniz.",
  })
  reservationDate!: string;
}
