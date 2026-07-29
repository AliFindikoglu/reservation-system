import { UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const guard = new JwtAuthGuard();

  it("eksik token için Türkçe mesaj döndürür", () => {
    expect(() =>
      guard.handleRequest(null, false, new Error("No auth token")),
    ).toThrow(new UnauthorizedException("Bu işlem için giriş yapınız."));
  });

  it("süresi dolmuş token için Türkçe mesaj döndürür", () => {
    const error = Object.assign(new Error(), {
      name: "TokenExpiredError",
    });

    expect(() => guard.handleRequest(null, false, error)).toThrow(
      new UnauthorizedException(
        "Oturum süreniz dolmuştur. Lütfen yeniden giriş yapınız.",
      ),
    );
  });

  it("geçersiz token için Türkçe mesaj döndürür", () => {
    const error = Object.assign(new Error(), {
      name: "JsonWebTokenError",
    });

    expect(() => guard.handleRequest(null, false, error)).toThrow(
      new UnauthorizedException(
        "Oturum bilgileriniz geçersizdir. Lütfen yeniden giriş yapınız.",
      ),
    );
  });
});
