import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super(<StrategyOptionsWithRequest>{
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,//only ensure to take refresh tokens
      passReqToCallback: true,//calls validate payload
      ignoreExpiration: false, 
    });
  }

  async validate(_req: any, payload: { sub: number; email: string }) {
    return { sub: payload.sub, email: payload.email };
  }
}
