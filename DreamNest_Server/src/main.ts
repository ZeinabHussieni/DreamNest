import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // serve static files from uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // will be available at http://localhost:3000/uploads/filename.png
  });
  app.enableCors({ origin: ['http://localhost:3000','http://localhost:3001'], credentials: true });
  await app.listen(3000);
}
bootstrap();
