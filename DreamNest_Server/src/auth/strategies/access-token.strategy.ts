import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service'; 

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly prisma: PrismaService) { 
    super(<StrategyOptionsWithoutRequest>{
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const mod = await this.prisma.userModeration.findUnique({ where: { userId: payload.sub } });
    if (mod?.siteBlocked) {
      throw new UnauthorizedException('Account suspended.');
    }
    return { sub: payload.sub, email: payload.email };
  }
}
