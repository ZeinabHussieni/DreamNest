import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
@Injectable()
//uses access tokens
export class AccessTokenGuard extends AuthGuard('jwt') {}
