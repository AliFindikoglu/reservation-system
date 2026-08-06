import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateProfileDto } from "./update-profile.dto";

const officeId = "00000000-0000-4000-8000-000000000001";

describe("UpdateProfileDto", () => {
  it("alanlar gönderilmediğinde DTO doğrulamasını geçer", async () => {
    await expect(validate(new UpdateProfileDto())).resolves.toHaveLength(0);
  });

  it("geçerli ad soyad ve telefon bilgisini kabul eder", async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      fullName: "  Ayşe Yılmaz  ",
      phone: "05061234215",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.fullName).toBe("Ayşe Yılmaz");
  });

  it.each([
    { fullName: "   " },
    { fullName: null },
    { phone: null },
    { phone: "+905061234215" },
    { phone: "0506123421" },
    { phone: "06061234215" },
    { preferredOfficeId: "istanbul" },
    { themePreference: "SYSTEM" },
  ])("geçersiz profil bilgisini reddeder", async (invalid) => {
    const dto = Object.assign(new UpdateProfileDto(), invalid);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it("geçerli ofis ve tema tercihini kabul eder", async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      preferredOfficeId: officeId,
      themePreference: "DARK",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
