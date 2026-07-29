import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateProfileDto } from "./update-profile.dto";

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
  ])("geçersiz profil bilgisini reddeder", async (invalid) => {
    const dto = Object.assign(new UpdateProfileDto(), invalid);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
