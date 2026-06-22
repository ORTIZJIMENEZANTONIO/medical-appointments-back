import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  /* pino como logger de Nest */
  app.useLogger(app.get(Logger));

  /* Validación global */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina props que no están en el DTO
      forbidNonWhitelisted: true, // rechaza props desconocidas → 400
      transform: true, // CLAVE: habilita @Type/@Transform (fecha y phone)
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  /* Swagger en /api/docs */
  const config = new DocumentBuilder()
    .setTitle('Medical Appointments API')
    .setDescription('API para agendar citas médicas sin empalmes de horario')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
