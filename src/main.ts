import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.use('/api/webhook/stripe', bodyParser.raw({ type: 'application/json' }));


  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: '*', // Allow any origin
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('User Profile API')
    .setDescription('API documentation for Module 2 (User Profile)')
    .setVersion('1.0.0')
    .addBearerAuth() // Add Bearer token authentication
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Swagger UI available at /api-docs

  // Start the application
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
