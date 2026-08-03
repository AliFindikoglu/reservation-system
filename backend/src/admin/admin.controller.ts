import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AdminService } from "./admin.service";
import {
  AdminReservationDto,
  CancelAdminReservationDto,
  UpdateAdminReservationDto,
} from "./dto/admin-reservation.dto";
import { UpdateUserRoleDto, UpdateUserStatusDto } from "./dto/admin-user.dto";
import {
  CreateRestrictionDto,
  RevokeRestrictionDto,
  UpdateRestrictionDto,
} from "./dto/restriction.dto";
import {
  CreateTableAssignmentDto,
  RevokeAssignmentDto,
  UpdateAssignmentEndDateDto,
} from "./dto/table-assignment.dto";
import { UpdateTableEquipmentsDto } from "./dto/update-table-equipments.dto";
import { AvailableTablesQueryDto } from "../tables/dto/available-tables-query.dto";
import { TablesService } from "../tables/tables.service";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly tablesService: TablesService,
  ) {}

  @Get("users")
  findUsers(@Query("includeInactive") includeInactive?: string) {
    return this.adminService.findUsers(includeInactive !== "false");
  }

  @Patch("users/:id/status")
  updateUserStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(admin.userId, id, dto);
  }

  @Patch("users/:id/role")
  updateUserRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(admin.userId, id, dto);
  }

  @Get("reservations")
  findReservations(@Query("includeCancelled") includeCancelled?: string) {
    return this.adminService.findReservations(includeCancelled !== "false");
  }

  @Post("reservations/preview")
  @HttpCode(HttpStatus.OK)
  previewReservation(@Body() dto: AdminReservationDto) {
    return this.adminService.previewReservation(dto);
  }

  @Post("reservations")
  createReservation(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: AdminReservationDto,
  ) {
    return this.adminService.createReservation(admin.userId, dto);
  }

  @Patch("reservations/:id")
  updateReservation(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminReservationDto,
  ) {
    return this.adminService.updateReservation(admin.userId, id, dto);
  }

  @Post("reservations/:id/preview-update")
  @HttpCode(HttpStatus.OK)
  previewReservationUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminReservationDto,
  ) {
    return this.adminService.previewReservationUpdate(id, dto);
  }

  @Delete("reservations/:id")
  cancelReservation(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CancelAdminReservationDto,
  ) {
    return this.adminService.cancelReservation(admin.userId, id, dto);
  }

  @Get("table-assignments")
  findAssignments(@Query("includeRevoked") includeRevoked?: string) {
    return this.adminService.findAssignments(includeRevoked !== "false");
  }

  @Post("table-assignments/preview")
  @HttpCode(HttpStatus.OK)
  previewAssignment(@Body() dto: CreateTableAssignmentDto) {
    return this.adminService.previewAssignment(dto);
  }

  @Post("table-assignments")
  createAssignment(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: CreateTableAssignmentDto,
  ) {
    return this.adminService.createAssignment(admin.userId, dto);
  }

  @Patch("table-assignments/:id/end-date")
  updateAssignmentEndDate(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentEndDateDto,
  ) {
    return this.adminService.updateAssignmentEndDate(admin.userId, id, dto);
  }

  @Delete("table-assignments/:id")
  revokeAssignment(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RevokeAssignmentDto,
  ) {
    return this.adminService.revokeAssignment(admin.userId, id, dto);
  }

  @Get("restrictions")
  findRestrictions(@Query("includeRevoked") includeRevoked?: string) {
    return this.adminService.findRestrictions(includeRevoked !== "false");
  }

  @Post("restrictions/preview")
  @HttpCode(HttpStatus.OK)
  previewRestriction(@Body() dto: CreateRestrictionDto) {
    return this.adminService.previewRestriction(dto);
  }

  @Post("restrictions")
  createRestriction(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: CreateRestrictionDto,
  ) {
    return this.adminService.createRestriction(admin.userId, dto);
  }

  @Patch("restrictions/:id")
  updateRestriction(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestrictionDto,
  ) {
    return this.adminService.updateRestriction(admin.userId, id, dto);
  }

  @Delete("restrictions/:id")
  revokeRestriction(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RevokeRestrictionDto,
  ) {
    return this.adminService.revokeRestriction(admin.userId, id, dto);
  }

  @Put("tables/:id/equipments")
  updateTableEquipments(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTableEquipmentsDto,
  ) {
    return this.adminService.updateTableEquipments(admin.userId, id, dto);
  }

  @Get("tables/statuses")
  findTableStatuses(@Query() query: AvailableTablesQueryDto) {
    return this.tablesService.findAdminStatuses(query.date);
  }

  @Get("audit-logs")
  findAuditLogs() {
    return this.adminService.findAuditLogs();
  }
}
