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
          phone: "+905551112233",
          password: "secret1",
        }),
      ),
    ).resolves.toHaveLength(0));
  it.each([{ email: "ayse@gmail.com" }, { phone: "abc" }, { password: "123" }])(
    "geçersiz kayıt bilgisini reddeder",
    async (invalid) =>
      expect(
        validate(
          Object.assign(
            new RegisterDto(),
            {
              fullName: "Ayşe Yılmaz",
              email: "ayse@eteration.com",
              phone: "+905551112233",
              password: "secret1",
            },
            invalid,
          ),
        ),
      ).resolves.not.toHaveLength(0),
  );
});
