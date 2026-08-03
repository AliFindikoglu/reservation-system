import { Module } from "@nestjs/common";
import { TableAssignmentsController } from "./table-assignments.controller";
import { TableAssignmentsService } from "./table-assignments.service";

@Module({
  controllers: [TableAssignmentsController],
  providers: [TableAssignmentsService],
})
export class TableAssignmentsModule {}
