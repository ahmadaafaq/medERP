import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.setGlobalPrefix('api/v1');
  app.use(helmet({
    contentSecurityPolicy: false, // Allows Swagger UI inline scripts & CSS
  }));
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('UniCampus MedERP API')
    .setDescription('Multi-tenant Medical University ERP Backend API')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 MedERP Backend API running on port ${port} (0.0.0.0)`);
  logger.log(`📄 Swagger Documentation available at http://localhost:${port}/docs`);
}
bootstrap();
