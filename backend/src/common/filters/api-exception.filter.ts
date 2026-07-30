import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

interface ExceptionResponseBody {
  message?: string | string[];
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        "An unexpected server error occurred.",
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message: this.getMessage(exception, status, request),
    });
  }

  private getMessage(
    exception: unknown,
    status: number,
    request: Request,
  ): string {
    if (!(exception instanceof HttpException)) {
      return "An unexpected error occurred. Please try again later.";
    }

    const exceptionResponse = exception.getResponse();
    const rawMessage =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as ExceptionResponseBody).message;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    if (
      status === HttpStatus.BAD_REQUEST &&
      message === "Please provide only supported fields." &&
      request.method === "PATCH" &&
      request.path === "/auth/me"
    ) {
      return "Please update only the full name and phone number fields.";
    }

    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof message === "string" &&
      (message.startsWith("Unexpected") || message.startsWith("Expected"))
    ) {
      return "Please provide a valid JSON request body.";
    }

    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      return this.getDefaultMessage(status);
    }

    if (
      status === HttpStatus.NOT_FOUND &&
      typeof message === "string" &&
      message.startsWith("Cannot ")
    ) {
      return "The requested API endpoint was not found.";
    }

    if (message && !this.isDefaultFrameworkMessage(message)) {
      return message;
    }

    return this.getDefaultMessage(status);
  }

  private isDefaultFrameworkMessage(message: string): boolean {
    return [
      "Bad Request",
      "Unauthorized",
      "Forbidden",
      "Not Found",
      "Conflict",
      "Internal Server Error",
      "Payload Too Large",
    ].includes(message);
  }

  private getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: "Please check the submitted information.",
      [HttpStatus.UNAUTHORIZED]: "Please sign in to perform this action.",
      [HttpStatus.FORBIDDEN]:
        "You do not have permission to perform this action.",
      [HttpStatus.NOT_FOUND]: "The requested resource was not found.",
      [HttpStatus.CONFLICT]:
        "The request conflicts with existing records.",
      [HttpStatus.PAYLOAD_TOO_LARGE]:
        "The request body exceeds the allowed size.",
      [HttpStatus.INTERNAL_SERVER_ERROR]:
        "An unexpected error occurred. Please try again later.",
    };

    return (
      messages[status] ??
      "The request could not be processed. Please try again later."
    );
  }
}
