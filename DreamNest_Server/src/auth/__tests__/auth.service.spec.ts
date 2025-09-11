import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


jest.mock('argon2', () => ({
  hash: jest.fn(async (s: string) => `hashed:${s}`),
  verify: jest.fn(async (hash: string, plain: string) => hash === `hashed:${plain}`),
}));


jest.mock('src/common/shared/file.utils', () => ({
  saveBase64Image: jest.fn(() => 'avatar.png'),
}));

import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const users = {
    findByEmailOrUsername: jest.fn(),
    create: jest.fn(),
    setRefreshToken: jest.fn(),
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
  };

  const jwt = {
    sign: jest.fn(),
  };

  const config = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        JWT_ACCESS_SECRET: 'acc-secret',
        JWT_REFRESH_SECRET: 'ref-secret',
        JWT_ACCESS_TTL: '45m',
        JWT_REFRESH_TTL: '7d',
      };
      return map[key];
    }),
  };

  const demoUser = {
    id: 1,
    firstName: 'A',
    lastName: 'B',
    userName: 'ab',
    email: 'a@b.com',
    coins: 0,
    passwordHash: 'hashed:pw',
    profilePicture: null,
    refreshTokenHash: 'hashed:refresh',
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    jwt.sign
      .mockReturnValueOnce('acc-token')   
      .mockReturnValueOnce('ref-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: users },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates user, hashes password, saves refresh & returns tokens + user', async () => {
      users.findByEmailOrUsername.mockResolvedValue(null);
      users.create.mockResolvedValue(demoUser);
      users.setRefreshToken.mockResolvedValue(undefined);

      const res = await service.register(
        'A', 'B', 'ab', 'a@b.com', 'pw', 'data:image/png;base64,xxx',
      );

      expect(users.findByEmailOrUsername).toHaveBeenCalledWith('a@b.com', 'ab');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'A',
          lastName: 'B',
          userName: 'ab',
          email: 'a@b.com',
          passwordHash: 'hashed:pw',
          profilePicture: 'avatar.png',
        }),
      );
      expect(users.setRefreshToken).toHaveBeenCalledWith(1, 'hashed:ref-token');
      expect(res).toEqual({
        user: {
          id: 1, firstName: 'A', lastName: 'B', userName: 'ab',
          email: 'a@b.com', coins: 0, profilePicture: null,
        },
        accessToken: 'acc-token',
        refreshToken: 'ref-token',
      });
    });

    it('throws ConflictException if email/username already in use (pre-check)', async () => {
      users.findByEmailOrUsername.mockResolvedValue({ email: 'a@b.com', userName: 'ab' });
      await expect(
        service.register('A', 'B', 'ab', 'a@b.com', 'pw'),
      ).rejects.toThrow(ConflictException);
    });

    it('maps Prisma P2002 to ConflictException with field hints', async () => {
      users.findByEmailOrUsername.mockResolvedValue(null);
      const err: any = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
        meta: { target: ['email'] },
      } as any);
      users.create.mockRejectedValue(err);

      await expect(
        service.register('A', 'B', 'ab', 'a@b.com', 'pw'),
      ).rejects.toThrow(ConflictException);
    });

    it('wraps unexpected errors as InternalServerError', async () => {
      users.findByEmailOrUsername.mockResolvedValue(null);
      users.create.mockRejectedValue(new Error('db down'));

      await expect(
        service.register('A', 'B', 'ab', 'a@b.com', 'pw'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
  it('returns tokens when identifier+password are valid', async () => {
    users.findByIdentifier.mockResolvedValue(demoUser);
    users.setRefreshToken.mockResolvedValue(undefined);

    // 🔧 reset then set the tokens you assert
    (jwt.sign as jest.Mock).mockReset();
    jwt.sign
      .mockReturnValueOnce('acc2')
      .mockReturnValueOnce('ref2');

    const res = await service.login('a@b.com', 'pw');

    expect(users.findByIdentifier).toHaveBeenCalledWith('a@b.com');
    expect(res).toMatchObject({
      user: expect.objectContaining({ id: 1 }),
      accessToken: 'acc2',
      refreshToken: 'ref2',
    });
    expect(users.setRefreshToken).toHaveBeenCalledWith(1, 'hashed:ref2');
  });
});

describe('refresh', () => {
  it('valid refresh returns new tokens', async () => {
    users.findById.mockResolvedValue(demoUser);
    users.setRefreshToken.mockResolvedValue(undefined);


    (jwt.sign as jest.Mock).mockReset();
    jwt.sign
      .mockReturnValueOnce('acc3')
      .mockReturnValueOnce('ref3');

    const res = await service.refresh(1, 'a@b.com', 'refresh');
    expect(res).toEqual({ accessToken: 'acc3', refreshToken: 'ref3' });
    expect(users.setRefreshToken).toHaveBeenCalledWith(1, 'hashed:ref3');
  });
});

  describe('getUser', () => {
    it('returns formatted user', async () => {
      users.findById.mockResolvedValue(demoUser);
      const res = await service.getUser(1);
      expect(res).toMatchObject({ id: 1, email: 'a@b.com' });
    });

    it('throws NotFound if no user', async () => {
      users.findById.mockResolvedValue(null);
      await expect(service.getUser(1)).rejects.toThrow(NotFoundException);
    });

    it('wraps unexpected errors as InternalServerError', async () => {
      users.findById.mockRejectedValue(new Error('db'));
      await expect(service.getUser(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('logout', () => {
    it('clears refresh token', async () => {
      users.setRefreshToken.mockResolvedValue(undefined);
      const res = await service.logout({ sub: 5 } as any);
      expect(users.setRefreshToken).toHaveBeenCalledWith(5);
      expect(res).toEqual({ success: true });
    });

    it('wraps unexpected errors as InternalServerError', async () => {
      users.setRefreshToken.mockRejectedValue(new Error('db'));
      await expect(service.logout(1)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
