import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export function IsCompanyEmail(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "isCompanyEmail",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          const domain = process.env.COMPANY_EMAIL_DOMAIN?.trim().toLowerCase();
          if (!domain || typeof value !== "string") {
            return false;
          }
          return (
            value.trim().length > domain.length &&
            value.trim().toLowerCase().endsWith(domain) &&
            value.trim().includes("@")
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must use the company email domain.`;
        },
      },
    });
  };
}
