import { UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const guard = new JwtAuthGuard();

  it("eksik token için İngilizce mesaj döndürür", () => {
    expect(() =>
      guard.handleRequest(null, false, new Error("No auth token")),
    ).toThrow(
      new UnauthorizedException("Please sign in to perform this action."),
    );
  });

  it("süresi dolmuş token için İngilizce mesaj döndürür", () => {
    const error = Object.assign(new Error(), {
      name: "TokenExpiredError",
    });

    expect(() => guard.handleRequest(null, false, error)).toThrow(
      new UnauthorizedException(
        "Your session has expired. Please sign in again.",
      ),
    );
  });

  it("geçersiz token için İngilizce mesaj döndürür", () => {
    const error = Object.assign(new Error(), {
      name: "JsonWebTokenError",
    });

    expect(() => guard.handleRequest(null, false, error)).toThrow(
      new UnauthorizedException(
        "Your session is invalid. Please sign in again.",
      ),
    );
  });
});
