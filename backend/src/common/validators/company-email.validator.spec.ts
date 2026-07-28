import { IsEmail, validate } from "class-validator";
import { IsCompanyEmail } from "./company-email.validator";

class EmailDto {
  @IsEmail()
  @IsCompanyEmail()
  email!: string;
}

describe("IsCompanyEmail", () => {
  const originalDomain = process.env.COMPANY_EMAIL_DOMAIN;

  beforeEach(() => {
    process.env.COMPANY_EMAIL_DOMAIN = "@firma.com";
  });

  afterAll(() => {
    process.env.COMPANY_EMAIL_DOMAIN = originalDomain;
  });

  it("şirket alan adlı e-postayı kabul eder", async () => {
    const dto = Object.assign(new EmailDto(), { email: "ayse@firma.com" });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("şirket dışı e-postayı reddeder", async () => {
    const dto = Object.assign(new EmailDto(), { email: "ayse@gmail.com" });
    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
