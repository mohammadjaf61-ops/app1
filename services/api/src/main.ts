import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestContextMiddleware, StructuredLogger } from './common/observability';

async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Use structured logger for NestJS internal logs
    bufferLogs: true,
  });
  app.useLogger(new StructuredLogger('NestJS'));

  const configService = app.get(ConfigService);

  // Configure logger based on environment
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  if (nodeEnv === 'production') {
    StructuredLogger.setMinLevel('log'); // No debug in production
  }

  // Request context middleware (must be first)
  const requestContextMiddleware = new RequestContextMiddleware();
  app.use(requestContextMiddleware.use.bind(requestContextMiddleware));

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS')?.split(',') || '*',
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Hypermarket API')
      .setDescription(
        `
# واجهة برمجة تطبيقات الهايبرماركت

API documentation for the Hypermarket platform.

## Authentication
All protected endpoints require a Bearer token in the Authorization header.

## Error Handling
All errors follow a standard format:
\`\`\`json
{
  "statusCode": 400,
  "message": "رسالة الخطأ",
  "errorCode": "VALIDATION_FAILED",
  "correlationId": "abc123",
  "timestamp": "2026-01-28T12:00:00.000Z"
}
\`\`\`

## Common Error Codes
| Code | Description |
|------|-------------|
| AUTH_UNAUTHORIZED | يجب تسجيل الدخول |
| AUTH_FORBIDDEN | غير مصرح لك بهذا الإجراء |
| VALIDATION_FAILED | بيانات غير صالحة |
| RESOURCE_NOT_FOUND | المورد غير موجود |
| INVENTORY_OUT_OF_STOCK | المنتج غير متوفر |
| ORDER_PRICE_CHANGED | تغير سعر المنتج |
      `,
      )
      .setVersion('1.0')
      .setContact('Hypermarket Team', '', 'support@hypermarket.iq')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication - تسجيل الدخول والخروج')
      .addTag('users', 'User management - إدارة المستخدمين')
      .addTag('products', 'Products - المنتجات')
      .addTag('categories', 'Categories - التصنيفات')
      .addTag('catalog', 'Catalog - الكتالوج العام')
      .addTag('orders', 'Orders - الطلبات')
      .addTag('admin', 'Admin Dashboard - لوحة التحكم')
      .addTag('inventory', 'Inventory - المخزون')
      .addTag('delivery', 'Delivery - التوصيل')
      .addTag('reports', 'Reports - التقارير')
      .addTag('audit', 'Audit - سجل التدقيق')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
      customSiteTitle: 'Hypermarket API Docs',
    });
  }

  // Start server
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log('Application started', {
    port,
    apiUrl: `http://localhost:${port}/api`,
    docsUrl: nodeEnv !== 'production' ? `http://localhost:${port}/docs` : undefined,
    environment: nodeEnv,
  });
}

bootstrap();
