import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { join } from 'path';

describe('AuthController', () => {
  let controller: AuthController;

  const svc = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    getUser: jest.fn(),
  };


  const resMock = {
    sendFile: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: svc }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('POST /auth/register -> forwards dto to service', async () => {
    const dto: any = {
      firstName: 'A', lastName: 'B', userName: 'ab', email: 'a@b.com', password: 'pw', profilePictureBase64: 'xxx',
    };
    const payload = { user: { id: 1 }, accessToken: 'a', refreshToken: 'r' };
    svc.register.mockResolvedValue(payload);

    const res = await controller.register(dto);
    expect(svc.register).toHaveBeenCalledWith(
      'A', 'B', 'ab', 'a@b.com', 'pw', 'xxx',
    );
    expect(res).toBe(payload);
  });

  it('GET /auth/profile/:filename -> sends file', async () => {
    const filename = 'pic.png';
    await controller.getProfile(filename, resMock as any);
    const expectedPath = join(process.cwd(), 'storage/private/profile', filename);
    expect(resMock.sendFile).toHaveBeenCalledWith(expectedPath);
  });

  it('POST /auth/login -> forwards to service', async () => {
    svc.login.mockResolvedValue({ user: { id: 1 }, accessToken: 'a', refreshToken: 'r' });
    const res = await controller.login({ identifier: 'ab', password: 'pw' } as any);
    expect(svc.login).toHaveBeenCalledWith('ab', 'pw');
    expect(res).toEqual({ user: { id: 1 }, accessToken: 'a', refreshToken: 'r' });
  });

  it('POST /auth/logout -> forwards userId.sub (your current code expects object)', async () => {
    svc.logout.mockResolvedValue({ success: true });
    const res = await controller.logout({ sub: 5 } as any);
    expect(svc.logout).toHaveBeenCalledWith(5);
    expect(res).toEqual({ success: true });
  });

  it('GET /auth/me -> returns whitelisted fields', async () => {
    svc.getUser.mockResolvedValue({
      id: 5, firstName: 'A', lastName: 'B', userName: 'ab', email: 'a@b.com', coins: 10, profilePicture: 'p.png',
    });
    const res = await controller.me(5 as any);
    expect(svc.getUser).toHaveBeenCalledWith(5);
    expect(res).toEqual({
      id: 5, firstName: 'A', lastName: 'B', userName: 'ab', email: 'a@b.com', coins: 10, profilePicture: 'p.png',
    });
  });

  it('GET /auth/getUser?id=X -> validates id and forwards', async () => {
    svc.getUser.mockResolvedValue({ id: 7 });
    const res = await controller.findUser('7');
    expect(svc.getUser).toHaveBeenCalledWith(7);
    expect(res).toEqual({ id: 7 });
  });

it('GET /auth/getUser -> throws when id missing', () => {

  expect(() => controller.findUser('' as any)).toThrow(BadRequestException);
  expect(svc.getUser).not.toHaveBeenCalled();
});

it('POST /auth/refresh -> throws if header missing', () => {
  const req: any = { headers: {} };
 
  expect(() => controller.refresh(1 as any, 'e' as any, req)).toThrow(BadRequestException);
  expect(svc.refresh).not.toHaveBeenCalled();
});



});
