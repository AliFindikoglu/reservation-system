import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { TablesModule } from "./tables/tables.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (environment: Record<string, unknown>) => {
        const jwtSecret = String(environment.JWT_SECRET ?? "");
        if (jwtSecret.length < 32) {
          throw new Error("JWT_SECRET en az 32 karakter olmalıdır.");
        }

        const maximumDays = Number(environment.MAX_RESERVATION_DAYS_AHEAD ?? 7);
        if (!Number.isInteger(maximumDays) || maximumDays < 0) {
          throw new Error(
            "MAX_RESERVATION_DAYS_AHEAD sıfır veya pozitif bir tam sayı olmalıdır.",
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
  ],
})
export class AppModule {}
