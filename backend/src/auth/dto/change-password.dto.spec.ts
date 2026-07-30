import { validate } from "class-validator";
import { ChangePasswordDto } from "./change-password.dto";

describe("ChangePasswordDto", () => {
  it("accepts a valid current and new password", async () => {
    const dto = Object.assign(new ChangePasswordDto(), {
      currentPassword: "GucluParola1!",
      newPassword: "YeniGucluParola2!",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([
    { currentPassword: "", newPassword: "YeniGucluParola2!" },
    { currentPassword: null, newPassword: "YeniGucluParola2!" },
    { currentPassword: "GucluParola1!", newPassword: "short" },
    { currentPassword: "GucluParola1!", newPassword: "yeniparola1!" },
    { currentPassword: "GucluParola1!", newPassword: "YENIPAROLA1!" },
    { currentPassword: "GucluParola1!", newPassword: "YeniParola!" },
    { currentPassword: "GucluParola1!", newPassword: "YeniParola1" },
    { currentPassword: "GucluParola1!", newPassword: "Yeni Parola1!" },
  ])("rejects invalid password input", async (invalid) => {
    const dto = Object.assign(new ChangePasswordDto(), invalid);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
