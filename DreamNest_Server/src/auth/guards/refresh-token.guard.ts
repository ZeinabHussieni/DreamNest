import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
@Injectable()
//uses refresh token
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
