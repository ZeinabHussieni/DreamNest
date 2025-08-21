import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}


  async issueTokens(userId: number, email: string) {
    try {
      const payload = { sub: userId, email };
      const accessToken = this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL') || '15m',
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

  async saveRefresh(userId: number, refreshToken: string) {
    try {
      const hashedToken = await argon2.hash(refreshToken);
      return this.users.setRefreshToken(userId, hashedToken);
    } catch (err) {
      throw new InternalServerErrorException('Failed to save refresh token');
    }
  }

  async refresh(userId: number, email: string, presentedToken: string) {
    try {
      const user = await this.users.findById(userId);
      if (!user || !user.refreshTokenHash) throw new UnauthorizedException();

      const isValid = await argon2.verify(user.refreshTokenHash, presentedToken);
      if (!isValid) throw new UnauthorizedException();

      const tokens = await this.issueTokens(user.id, user.email);
      await this.saveRefresh(user.id, tokens.refreshToken);
      return tokens;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to refresh tokens');
    }
  }

  
  async register(
    firstName: string,
    lastName: string,
    userName: string,
    email: string,
    password: string,
    profilePicture?: string,
  ) {
    try {
      const exists = await this.users.findByEmailOrUsername(email, userName);
      if (exists) throw new UnauthorizedException('Email or username already in use');

      const hashedPassword = await argon2.hash(password);

      const user = await this.users.create({
        firstName,
        lastName,
        userName,
        email,
        password: hashedPassword,
        profilePicture,
      });

      const tokens = await this.issueTokens(user.id, user.email);
      await this.saveRefresh(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email,
          profilePicture: user.profilePicture ? `/uploads/${user.profilePicture}` : null,
        },
        ...tokens,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(identifier: string, password: string) {
    try {
      const user = await this.users.findByIdentifier(identifier);
      if (!user) throw new UnauthorizedException('Invalid credentials');

      const isValid = await argon2.verify(user.passwordHash, password);
      if (!isValid) throw new UnauthorizedException('Invalid credentials');

      const tokens = await this.issueTokens(user.id, user.email);
      await this.saveRefresh(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email,
        },
        ...tokens,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Login failed');
    }
  }

  async getUser(userId: number) {
    try {
      const user = await this.users.findById(userId);
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        profilePicture: user.profilePicture ? `/uploads/${user.profilePicture}` : null,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
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
}
