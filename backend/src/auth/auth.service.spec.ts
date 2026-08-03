import {
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const users = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateProfile: jest.fn(),
    updatePasswordHash: jest.fn(),
  };
  const jwt = { sign: jest.fn().mockReturnValue("jwt-token") };
  const service = new AuthService(users as never, jwt as never);

  beforeEach(() => jest.clearAllMocks());

  it("kayıtta parolayı hashleyip token döndürür", async () => {
    users.create.mockImplementation((input) => ({ id: "u1", ...input }));

    await expect(
      service.register({
        fullName: "Ayşe",
        email: "AYSE@eteration.com",
        phone: "05061112233",
        password: "secret12",
      }),
    ).resolves.toMatchObject({ accessToken: "jwt-token" });

    expect(users.create.mock.calls[0][0].passwordHash).not.toBe("secret12");
  });

  it("doğru parola ile giriş yaptırır", async () => {
    users.findByEmail.mockResolvedValue({
      id: "u1",
      fullName: "Ayşe",
      email: "ayse@eteration.com",
      phone: "05061112233",
      passwordHash: await bcrypt.hash("secret12", 10),
      role: UserRole.USER,
      isActive: true,
    });

    await expect(
      service.login({
        email: "ayse@eteration.com",
        password: "secret12",
      }),
    ).resolves.toMatchObject({ accessToken: "jwt-token" });
  });

  it("yanlış parolayı reddeder", async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: "x@eteration.com",
        password: "wrong",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("giriş yapan kullanıcının profilini parola hash olmadan döndürür", async () => {
    users.findById.mockResolvedValue({
      id: "u1",
      fullName: "Ayşe",
      email: "ayse@eteration.com",
      phone: "05061112233",
      passwordHash: "gizli-hash",
      role: UserRole.USER,
      isActive: true,
    });

    await expect(service.me("u1")).resolves.toEqual({
      id: "u1",
      fullName: "Ayşe",
      email: "ayse@eteration.com",
      phone: "05061112233",
      role: UserRole.USER,
      isActive: true,
    });
  });

  it("yalnız ad ve telefon bilgisini güncelleyip güvenli profil döndürür", async () => {
    users.updateProfile.mockResolvedValue({
      id: "u1",
      fullName: "Ayşe Kaya",
      email: "ayse@eteration.com",
      phone: "05069999999",
      passwordHash: "gizli-hash",
      role: UserRole.USER,
      isActive: true,
    });

    await expect(
      service.updateProfile("u1", {
        fullName: "  Ayşe Kaya  ",
        phone: "  05069999999  ",
      }),
    ).resolves.toEqual({
      id: "u1",
      fullName: "Ayşe Kaya",
      email: "ayse@eteration.com",
      phone: "05069999999",
      role: UserRole.USER,
      isActive: true,
    });

    expect(users.updateProfile).toHaveBeenCalledWith("u1", {
      fullName: "Ayşe Kaya",
      phone: "05069999999",
    });
  });

  it("mevcut parola doğruysa yeni parolayı hashleyerek günceller", async () => {
    users.findById.mockResolvedValue({
      id: "u1",
      passwordHash: await bcrypt.hash("GucluParola1!", 10),
    });
    users.updatePasswordHash.mockResolvedValue({ id: "u1" });

    await expect(
      service.changePassword("u1", {
        currentPassword: "GucluParola1!",
        newPassword: "YeniGucluParola2!",
      }),
    ).resolves.toEqual({
      message: "Your password has been changed successfully.",
    });

    const updatedHash = users.updatePasswordHash.mock.calls[0][1] as string;
    expect(updatedHash).not.toBe("YeniGucluParola2!");
    await expect(
      bcrypt.compare("YeniGucluParola2!", updatedHash),
    ).resolves.toBe(true);
  });

  it("yanlış mevcut parolayla değişikliği reddeder", async () => {
    users.findById.mockResolvedValue({
      id: "u1",
      passwordHash: await bcrypt.hash("GucluParola1!", 10),
    });

    await expect(
      service.changePassword("u1", {
        currentPassword: "YanlisParola1!",
        newPassword: "YeniGucluParola2!",
      }),
    ).rejects.toEqual(
      new UnauthorizedException("The current password is incorrect."),
    );
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
  });

  it("yeni parola mevcut parolayla aynıysa değişikliği reddeder", async () => {
    users.findById.mockResolvedValue({
      id: "u1",
      passwordHash: await bcrypt.hash("GucluParola1!", 10),
    });

    await expect(
      service.changePassword("u1", {
        currentPassword: "GucluParola1!",
        newPassword: "GucluParola1!",
      }),
    ).rejects.toEqual(
      new BadRequestException(
        "The new password must be different from the current password.",
      ),
    );
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
  });
});
