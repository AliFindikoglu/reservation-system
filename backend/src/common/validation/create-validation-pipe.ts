import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";

function getFirstMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    if (error.constraints?.whitelistValidation) {
      return "Yalnızca desteklenen alanları gönderiniz.";
    }

    const message = error.constraints
      ? Object.values(error.constraints)[0]
      : undefined;
    if (message) {
      return message;
    }

    if (error.children?.length) {
      return getFirstMessage(error.children);
    }
  }

  return "Gönderilen bilgileri kontrol ediniz.";
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException(getFirstMessage(errors)),
  });
}
