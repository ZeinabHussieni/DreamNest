import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

test('msw server ready', () => expect(typeof server.listen).toBe('function'));


