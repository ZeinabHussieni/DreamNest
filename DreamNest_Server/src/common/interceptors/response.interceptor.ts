import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {//let as access req/res 
    const res = ctx.switchToHttp().getResponse();
    const req = ctx.switchToHttp().getRequest();

    return next.handle().pipe(//execute controller
        
    map((data) => {
     console.log('ResponseInterceptor working...', data);
     return {
     success: true,
     statusCode: res.statusCode,
     path: req.originalUrl || req.url,
     timestamp: new Date().toISOString(),
     data,
    };
   }),

    );
  }
}
