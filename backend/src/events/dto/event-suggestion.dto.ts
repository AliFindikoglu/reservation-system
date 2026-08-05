import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
import { CreateEventDto } from "./event.dto";

export class CreateEventSuggestionDto {
  @ApiProperty({
    example: "A practical TypeScript workshop would be useful.",
  })
  @IsString({ message: "Please enter a valid event suggestion." })
  @MinLength(3, { message: "The event suggestion must contain at least 3 characters." })
  @MaxLength(2000, { message: "The event suggestion cannot exceed 2000 characters." })
  suggestionText!: string;
}

export class AcceptEventSuggestionDto extends CreateEventDto {}

export class RejectEventSuggestionDto {
  @ApiProperty({ example: "The suggestion is outside the current event plan." })
  @IsString({ message: "Please enter a valid rejection reason." })
  @MinLength(3, { message: "The rejection reason must contain at least 3 characters." })
  @MaxLength(1000, { message: "The rejection reason cannot exceed 1000 characters." })
  reason!: string;
}
