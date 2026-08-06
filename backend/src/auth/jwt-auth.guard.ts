import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser>(
    error: unknown,
    user: TUser | false | null,
    info: unknown,
  ): TUser {
    if (error) {
      throw error;
    }

    const errorName = this.readErrorProperty(info, "name");
    const errorMessage = this.readErrorProperty(info, "message");

    if (errorName === "TokenExpiredError") {
      throw new UnauthorizedException(
        "Your session has expired. Please sign in again.",
      );
    }

    if (errorName === "JsonWebTokenError") {
      throw new UnauthorizedException(
        "Your session is invalid. Please sign in again.",
      );
    }

    if (errorMessage === "No auth token" || !user) {
      throw new UnauthorizedException("Please sign in to perform this action.");
    }

    return user;
  }

  private readErrorProperty(
    value: unknown,
    property: "name" | "message",
  ): string | undefined {
    if (
      typeof value !== "object" ||
      value === null ||
      !(property in value)
    ) {
      return undefined;
    }

    const propertyValue = (value as Record<string, unknown>)[property];
    return typeof propertyValue === "string" ? propertyValue : undefined;
  }
}
