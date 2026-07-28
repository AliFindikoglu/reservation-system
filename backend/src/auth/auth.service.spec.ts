import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const users = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateProfile: jest.fn(),
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
        phone: "+905551112233",
        password: "secret1",
      }),
    ).resolves.toMatchObject({ accessToken: "jwt-token" });

    expect(users.create.mock.calls[0][0].passwordHash).not.toBe("secret1");
  });

  it("doğru parola ile giriş yaptırır", async () => {
    users.findByEmail.mockResolvedValue({
      id: "u1",
      fullName: "Ayşe",
      email: "ayse@eteration.com",
      phone: "+905551112233",
      passwordHash: await bcrypt.hash("secret1", 10),
    });

    await expect(
      service.login({
        email: "ayse@eteration.com",
        password: "secret1",
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
      phone: "+905551112233",
      passwordHash: "gizli-hash",
    });

    await expect(service.me("u1")).resolves.toEqual({
      id: "u1",
      fullName: "Ayşe",
      email: "ayse@eteration.com",
      phone: "+905551112233",
    });
  });

  it("yalnız ad ve telefon bilgisini güncelleyip güvenli profil döndürür", async () => {
    users.updateProfile.mockResolvedValue({
      id: "u1",
      fullName: "Ayşe Kaya",
      email: "ayse@eteration.com",
      phone: "+905559999999",
      passwordHash: "gizli-hash",
    });

    await expect(
      service.updateProfile("u1", {
        fullName: "  Ayşe Kaya  ",
        phone: "  +905559999999  ",
      }),
    ).resolves.toEqual({
      id: "u1",
      fullName: "Ayşe Kaya",
      email: "ayse@eteration.com",
      phone: "+905559999999",
    });

    expect(users.updateProfile).toHaveBeenCalledWith("u1", {
      fullName: "Ayşe Kaya",
      phone: "+905559999999",
    });
  });
});
