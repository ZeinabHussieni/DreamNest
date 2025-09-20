import { Injectable,ForbiddenException,ConflictException, UnauthorizedException,HttpException, InternalServerErrorException,NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserService } from 'src/user/user.service';
import { saveBase64Image } from '../common/shared/file.utils';
import { User as PrismaUser } from '@prisma/client';
import { AuthResponseDto } from './responseDto/auth-response.dto';
import { join } from 'path';
import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}


  async register(
    firstName: string,
    lastName: string,
    userName: string,
    email: string,
    password: string,
    profilePictureBase64?: string,
  ) {
    try {
      const exists = await this.users.findByEmailOrUsername(email, userName);
      if (exists) {
      throw new ConflictException({
        message: 'Email or username already in use',
        errors: {
        ...(exists.email === email ? { email: 'Email already in use' } : {}),
        ...(exists.userName === userName ? { userName: 'Username already in use' } : {}),
        },
      });
      }

      const hashedPassword = await argon2.hash(password);

      let profilePictureFilename: string | undefined;
      if (profilePictureBase64) {
       profilePictureFilename = saveBase64Image(
         profilePictureBase64,
         join(process.cwd(), 'storage/private/profile')

       );
      }

      const user = await this.users.create({
        firstName,
        lastName,
        userName,
        email,
        passwordHash: hashedPassword,
        profilePicture: profilePictureFilename,
      });

      const tokens = await this.generateAndSaveTokens(user);

      return {
        user: this.formatUser(user),
        ...tokens,
      } as AuthResponseDto;
    } catch (err) {
      if (err instanceof HttpException) throw err;


    if (err?.code === 'P2002') {
      const target = (err as Prisma.PrismaClientKnownRequestError)?.meta?.target as string[] | undefined;
      const errors: Record<string, string> = {};
      if (target?.includes('email')) errors.email = 'Email already in use';
      if (target?.includes('userName')) errors.userName = 'Username already in use';

      throw new ConflictException({
        message: 'Email or username already in use',
        errors: Object.keys(errors).length ? errors : {
          email: 'Email already in use', userName: 'Username already in use'
        },
      });
    }


    throw new InternalServerErrorException('Failed to register user');
  }
  }

  async login(identifier: string, password: string) {
    try {
      const user = await this.users.findByIdentifier(identifier);
    if (!user) {
    throw new UnauthorizedException({
     message: 'Invalid credentials',
     errors: { identifier: 'Incorrect email/username or password' }
    });
    }
    const mod = await this.prisma.userModeration.findUnique({ where: { userId: user.id } });
    if (mod?.siteBlocked) {
     throw new ForbiddenException('Account suspended.');
    }
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
     throw new UnauthorizedException({
     message: 'Invalid credentials',
     errors: { identifier: 'Incorrect email/username or password' }
    });
    }
      const tokens = await this.generateAndSaveTokens(user);

      return {
        user: this.formatUser(user),
        ...tokens,
      } as AuthResponseDto;
    } catch (err) {
     if (err instanceof HttpException) throw err;
    throw new InternalServerErrorException('Login failed');
    }
  }

  async refresh(userId: number, email: string, presentedToken: string) {
    try {
      const user = await this.users.findById(userId);
      if (!user || !user.refreshTokenHash) throw new UnauthorizedException();
      const mod = await this.prisma.userModeration.findUnique({ where: { userId } });
      if (mod?.siteBlocked) throw new UnauthorizedException('Account suspended.');

      const isValid = await argon2.verify(user.refreshTokenHash, presentedToken);
      if (!isValid) throw new UnauthorizedException();

      return await this.generateAndSaveTokens(user);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to refresh tokens');
    }
  }

  async getUser(userId: number) {
  try {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.formatUser(user);
  } catch (err) {
    if (err instanceof NotFoundException || err instanceof UnauthorizedException) {
      throw err; 
    }
    throw new InternalServerErrorException('Failed to fetch user');
  }
}

  async logout(userId: number) {
    try {
      await this.users.setRefreshToken(userId, null);
      return { success: true };
    } catch (err) {
      throw new InternalServerErrorException('Failed to logout');
    }
  }

 
  // private helpers
 private formatUser(user: PrismaUser) {
  return {
    id: user.id, 
    firstName: user.firstName,
    lastName: user.lastName,
    userName: user.userName,
    email: user.email,
    coins:user.coins,
    profilePicture: user.profilePicture

  };
 }

  private async generateAndSaveTokens(user: PrismaUser) {
    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return tokens;
  }

  private async issueTokens(userId: number, email: string) {
    try {
      const payload = { sub: userId, email };

      const accessToken = this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL') || '45m',
      });

      const refreshToken = this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL') || '7d',
      });

      return { accessToken, refreshToken };
    } catch (err) {
      throw new InternalServerErrorException('Failed to generate tokens');
    }
  }

  private async saveRefresh(userId: number, refreshToken: string) {
    try {
      const hashedToken = await argon2.hash(refreshToken);
      return this.users.setRefreshToken(userId, hashedToken);
    } catch (err) {
      throw new InternalServerErrorException('Failed to save refresh token');
    }
  }
}
