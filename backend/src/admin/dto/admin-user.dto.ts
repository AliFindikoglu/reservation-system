import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { IsBoolean, IsEnum } from "class-validator";

export class UpdateUserStatusDto {
  @ApiProperty()
  @IsBoolean({ message: "Please enter a valid active status." })
  isActive!: boolean;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole, { message: "Please select a valid user role." })
  role!: UserRole;
}
