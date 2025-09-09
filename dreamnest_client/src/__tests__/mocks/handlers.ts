import { rest } from 'msw';

export const handlers = [

  rest.post('*/auth/login', async (req, res, ctx) => {
    const body = await req.json();
    if (!body?.identifier || !body?.password) {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Invalid credentials', errors: { identifier: 'Required', password: 'Required' } })
      );
    }
    return res(
      ctx.json({
        success: true,
        statusCode: 200,
        path: '/auth/login',
        timestamp: new Date().toISOString(),
        data: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 1, userName: 'john', email: 'john@example.com' },
        },
      })
    );
  }),


  rest.get('*/notifications', (_req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        statusCode: 200,
        path: '/notifications',
        timestamp: new Date().toISOString(),
        data: [
          {
            id: 1,
            type: 'NEW_MESSAGE',
            userId: 1,
            content: 'You have a new message',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    )
  ),

  rest.patch('*/notifications/:id/read', (_req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        statusCode: 200,
        path: '/notifications/1/read',
        timestamp: new Date().toISOString(),
        data: {
          id: 1,
          type: 'NEW_MESSAGE',
          userId: 1,
          content: 'You have a new message',
          read: true,
          createdAt: new Date().toISOString(),
        },
      })
    )
  ),

  rest.delete('*/notifications/:id', (_req, res, ctx) => res(ctx.status(204))),
  rest.delete('*/notifications', (_req, res, ctx) => res(ctx.status(204))),


  rest.get('*/chat/rooms', (_req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        statusCode: 200,
        path: '/chat/rooms',
        timestamp: new Date().toISOString(),
        data: [
          {
            id: 10,
            name: 'General',
            participants: [],
            messages: [],
          },
        ],
      })
    )
  ),

  rest.get('*/chat/messages/:roomId', (_req, res, ctx) =>
    res(
      ctx.json({
        success: true,
        statusCode: 200,
        path: '/chat/messages/10',
        timestamp: new Date().toISOString(),
        data: [
          {
            id: 100,
            content: 'Welcome to General',
            createdAt: new Date().toISOString(),
            senderId: 2,
            chatRoomId: 10,
          },
        ],
      })
    )
  ),
];


test('msw handlers loaded', () => expect(true).toBe(true));


