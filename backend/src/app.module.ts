import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { TablesModule } from "./tables/tables.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { EquipmentsModule } from "./equipments/equipments.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { TableAssignmentsModule } from "./table-assignments/table-assignments.module";
import { RestrictionsModule } from "./restrictions/restrictions.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (environment: Record<string, unknown>) => {
        const jwtSecret = String(environment.JWT_SECRET ?? "");
        if (jwtSecret.length < 32) {
          throw new Error("JWT_SECRET must be at least 32 characters long.");
        }

        const maximumDays = Number(
          environment.MAX_RESERVATION_DAYS_AHEAD ?? 30,
        );
        if (!Number.isInteger(maximumDays) || maximumDays < 0) {
          throw new Error(
            "MAX_RESERVATION_DAYS_AHEAD must be a non-negative integer.",
          );
        }

        return {
          ...environment,
          MAX_RESERVATION_DAYS_AHEAD: String(maximumDays),
          JWT_EXPIRES_IN: String(environment.JWT_EXPIRES_IN ?? "1h"),
          BUSINESS_TIME_ZONE: String(
            environment.BUSINESS_TIME_ZONE ?? "Europe/Istanbul",
          ),
        };
      },
    }),
    PrismaModule,
    TablesModule,
    ReservationsModule,
    AuthModule,
    AdminModule,
    EquipmentsModule,
    NotificationsModule,
    TableAssignmentsModule,
    RestrictionsModule,
  ],
})
export class AppModule {}
