import {
  ArgumentsHost,Catch,ExceptionFilter,HttpException, HttpStatus,} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorName = 'Error';
    let message: any = 'Internal server error';
    let errors: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorName = exception.name;
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (Array.isArray((response as any)?.message)) {
        message = (response as any).message;
      } else if (typeof response === 'object' && response) {
        const obj = response as any;
        message = obj.message || message;
    
        if (obj.errors && typeof obj.errors === 'object') {
          errors = obj.errors;
        }
      }
    } else if (exception instanceof Error) {
      errorName = exception.name;
      message = exception.message || message;
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      path: req.originalUrl || req.url,
      timestamp: new Date().toISOString(),
      error: {
        name: errorName,
        message,
        ...(errors ? { errors } : {}), 
      },
    });
  }
}
