import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { createValidationPipe } from "./common/validation/create-validation-pipe";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  app.enableCors({ origin: corsOrigin });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(createValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Masa Rezervasyon API")
    .setDescription("Şirket içi masa rezervasyon sistemi API dokümantasyonu")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, document);

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
