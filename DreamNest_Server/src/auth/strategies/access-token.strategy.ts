import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super(<StrategyOptionsWithoutRequest>{
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),//pull token from header
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,//verify token
      ignoreExpiration: false,//rejected token expired
    });
  }

  async validate(payload: { sub: number; email: string }) { //return a safe user
    return { sub: payload.sub, email: payload.email };
  }
}
