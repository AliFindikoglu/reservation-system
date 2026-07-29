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
        "Beklenmeyen bir sunucu hatası oluştu.",
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
      return "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.";
    }

    const exceptionResponse = exception.getResponse();
    const rawMessage =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as ExceptionResponseBody).message;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    if (
      status === HttpStatus.BAD_REQUEST &&
      message === "Yalnızca desteklenen alanları gönderiniz." &&
      request.method === "PATCH" &&
      request.path === "/auth/me"
    ) {
      return "Yalnızca ad soyad ve telefon numarası alanlarını güncelleyiniz.";
    }

    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof message === "string" &&
      (message.startsWith("Unexpected") || message.startsWith("Expected"))
    ) {
      return "Geçerli bir JSON gövdesi gönderiniz.";
    }

    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      return this.getDefaultMessage(status);
    }

    if (
      status === HttpStatus.NOT_FOUND &&
      typeof message === "string" &&
      message.startsWith("Cannot ")
    ) {
      return "İstenen API adresi bulunamadı.";
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
      [HttpStatus.BAD_REQUEST]: "Gönderilen bilgileri kontrol ediniz.",
      [HttpStatus.UNAUTHORIZED]: "Bu işlem için giriş yapınız.",
      [HttpStatus.FORBIDDEN]: "Bu işlem için yetkiniz bulunmamaktadır.",
      [HttpStatus.NOT_FOUND]: "İstenen kaynak bulunamadı.",
      [HttpStatus.CONFLICT]: "İstek mevcut kayıtlarla çakışmaktadır.",
      [HttpStatus.PAYLOAD_TOO_LARGE]:
        "İstek gövdesi izin verilen boyutu aşmaktadır.",
      [HttpStatus.INTERNAL_SERVER_ERROR]:
        "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
    };

    return (
      messages[status] ??
      "İstek işlenemedi. Lütfen daha sonra tekrar deneyiniz."
    );
  }
}
