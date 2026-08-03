import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";
import { UserRole } from "@prisma/client";

describe("JwtStrategy", () => {
  const config = {
    getOrThrow: jest
      .fn()
      .mockReturnValue("test-only-secret-with-at-least-32-characters"),
  };
  const users = { findById: jest.fn() };
  const strategy = new JwtStrategy(config as never, users as never);

  beforeEach(() => jest.clearAllMocks());

  it("veritabanında bulunan kullanıcıyı doğrular", async () => {
    users.findById.mockResolvedValue({
      id: "u1",
      email: "ayse@eteration.com",
      role: UserRole.USER,
      isActive: true,
    });
    await expect(
      strategy.validate({
        userId: "u1",
        email: "old@eteration.com",
        role: UserRole.USER,
      }),
    ).resolves.toEqual({
      userId: "u1",
      email: "ayse@eteration.com",
      role: UserRole.USER,
    });
  });

  it("silinmiş kullanıcının geçerli imzalı tokenını reddeder", async () => {
    users.findById.mockResolvedValue(null);
    await expect(
      strategy.validate({
        userId: "deleted",
        email: "deleted@eteration.com",
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("pasif kullanıcının süresi dolmamış tokenını reddeder", async () => {
    users.findById.mockResolvedValue({
      id: "u1",
      email: "ayse@eteration.com",
      role: UserRole.USER,
      isActive: false,
    });
    await expect(
      strategy.validate({
        userId: "u1",
        email: "ayse@eteration.com",
        role: UserRole.USER,
      }),
    ).rejects.toEqual(
      new UnauthorizedException(
        "Your account is inactive. Please contact the system administrator.",
      ),
    );
  });
});
