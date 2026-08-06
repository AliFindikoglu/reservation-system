import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";

function getFirstMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    if (error.constraints?.whitelistValidation) {
      return "Please provide only supported fields.";
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

  return "Please check the submitted information.";
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
