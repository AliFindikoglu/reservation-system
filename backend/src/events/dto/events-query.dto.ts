import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum EventListScope {
  Upcoming = "UPCOMING",
  Past = "PAST",
  All = "ALL",
}

export class EventsQueryDto {
  @ApiPropertyOptional({ enum: EventListScope, default: EventListScope.Upcoming })
  @IsOptional()
  @IsEnum(EventListScope, {
    message: "Please enter UPCOMING, PAST, or ALL as the event scope.",
  })
  scope?: EventListScope;
}
