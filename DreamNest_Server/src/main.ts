import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe,BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { json, urlencoded } from 'express';


 

async function bootstrap() {

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
     app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));


  app.useGlobalPipes(new ValidationPipe({ 
     whitelist: true,              
      forbidNonWhitelisted: true,   
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (validationErrors = []) => {
        const errors: Record<string, string> = {};
        for (const err of validationErrors) {
          if (err.constraints) {
            const firstMessage = Object.values(err.constraints)[0];
            errors[err.property] = firstMessage;
          }
        }
        return new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      },
    })
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  app.enableCors({ origin: ['http://localhost:3000','http://localhost:3001'], credentials: true });
  await app.listen(3000);
}
bootstrap();
