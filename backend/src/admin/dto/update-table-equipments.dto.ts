import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsUUID } from "class-validator";

export class UpdateTableEquipmentsDto {
  @ApiProperty({ type: [String], format: "uuid" })
  @IsArray({ message: "Please provide the selected equipment IDs as an array." })
  @ArrayUnique({ message: "Please select each equipment only once." })
  @IsUUID("4", { each: true, message: "One or more selected equipments are invalid." })
  equipmentIds!: string[];
}
