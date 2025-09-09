import '@testing-library/jest-dom';
import { server } from './mocks/server';


beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));


afterEach(() => server.resetHandlers());


afterAll(() => server.close());


jest.mock('socket.io-client', () => {
  const { createSocketMock } = require('./mocks/socket.io-client');
  return {
    io: createSocketMock,
    Socket: function () {},
  };
});


jest.mock('react-router-dom', () => require('./mocks/react-router-dom'), { virtual: true });


jest.mock('../Services/socket/socket', () => require('./support/services-socket'));


// @ts-ignore
if (!HTMLElement.prototype.scrollIntoView) {
  // @ts-ignore
  HTMLElement.prototype.scrollIntoView = jest.fn();
}


jest.mock('sweetalert2', () => {
  const mod = require('./support/sweetalert2');
  return { __esModule: true, default: mod.default, fire: mod.fire };
});


test('global setup loaded', () => expect(true).toBe(true));


