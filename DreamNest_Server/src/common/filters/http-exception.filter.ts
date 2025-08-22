import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    // Default values for unexpected errors
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errorName = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      errorName = exception.name;

      // Nest/Validation errors may return an object or string/array
      if (typeof response === 'string') {
        message = response;
      } else if (Array.isArray((response as any)?.message)) {
        message = (response as any).message;
      } else if (typeof response === 'object' && response) {
        message = (response as any).message || message;
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
      },
    });
  }
}
