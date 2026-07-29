import { validate } from "class-validator";
import { RegisterDto } from "./register.dto";
describe("RegisterDto", () => {
  beforeEach(() => {
    process.env.COMPANY_EMAIL_DOMAIN = "@eteration.com";
  });
  it("geçerli kullanıcı kaydını kabul eder", async () =>
    expect(
      validate(
        Object.assign(new RegisterDto(), {
          fullName: "Ayşe Yılmaz",
          email: "ayse@eteration.com",
          phone: "05061234215",
          password: "GucluParola1!",
        }),
      ),
    ).resolves.toHaveLength(0));
  it.each([
    { email: "ayse@gmail.com" },
    { phone: "abc" },
    { phone: "+905061234215" },
    { phone: "0506123421" },
    { phone: "06061234215" },
    { password: "1234567" },
    { password: "gucluparola1!" },
    { password: "GUCLUPAROLA1!" },
    { password: "GucluParola!" },
    { password: "GucluParola1" },
    { password: "Guclu Parola1!" },
    { fullName: "   " },
    { fullName: null },
  ])(
    "geçersiz kayıt bilgisini reddeder",
    async (invalid) =>
      expect(
        validate(
          Object.assign(
            new RegisterDto(),
            {
              fullName: "Ayşe Yılmaz",
              email: "ayse@eteration.com",
              phone: "05061234215",
              password: "GucluParola1!",
            },
            invalid,
          ),
        ),
      ).resolves.not.toHaveLength(0),
  );
});
