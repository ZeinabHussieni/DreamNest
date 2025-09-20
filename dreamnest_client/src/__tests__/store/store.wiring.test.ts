import '../setup';
import { store } from '../../store/store';
jest.mock('../../Services/axios/axios', () => ({ __esModule: true, default: require('../mocks/__helpers__/axios-fetch').default }));

test('store wiring exposes reducers and dispatch', () => {
  expect(typeof store.dispatch).toBe('function');
  const state = store.getState() as any;
  expect(state.notifications).toBeDefined();
  expect(state.chat).toBeDefined();
});


