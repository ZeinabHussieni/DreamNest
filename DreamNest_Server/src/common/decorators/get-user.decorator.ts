import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(//allow custom decorator
  (data: string | undefined, ctx: ExecutionContext) => {//ctx have the request info 
    const request = ctx.switchToHttp().getRequest();
    if (data) return request.user[data]; 
    return request.user; 
  },
);
