import '../../setup';
jest.mock('../../../Services/axios/axios', () => {
  return {
    __esModule: true,
    default: {
      post: async (url: string, data?: any) => ({
        data: {
          success: true,
          statusCode: 200,
          path: url,
          timestamp: new Date().toISOString(),
          data: {
            accessToken: 'test-token',
            refreshToken: 'test-refresh',
            user: { id: 1, userName: 'john', email: 'john@example.com' },
          },
        },
      }),
    },
  };
});
import loginService from '../../../Services/auth/loginService';
import { server } from '../../mocks/server';
import { rest } from 'msw';

describe('loginService', () => {
  it('returns tokens and user on success', async () => {
    const result = await loginService({ identifier: 'john', password: 'secret' });
    expect(result.accessToken).toBe('test-token');
    expect(result.user.email).toBe('john@example.com');
  });

  it('returns tokens and user on success (mocked axios)', async () => {
    const result = await loginService({ identifier: 'john', password: 'secret' });
    expect(result.accessToken).toBe('test-token');
  });
});


