import '../setup';
jest.mock('../../Services/axios/axios', () => ({ __esModule: true, default: require('../mocks/__helpers__/axios-fetch').default }));
import reducer from '../../Redux/chat/chat.slice';
import { loadRoomsThunk, loadMessagesThunk } from '../../Redux/chat/chat.thunks';
import { configureStore } from '@reduxjs/toolkit';

function makeStore() {
  return configureStore({ reducer: { chat: reducer } });
}

test('loadRoomsThunk success sets rooms and auto-selects first', async () => {
  const store = makeStore();
  await store.dispatch(loadRoomsThunk());
  const s = store.getState().chat as any;
  expect(s.roomsStatus).toBe('succeeded');
  expect(s.rooms.length).toBeGreaterThan(0);
  expect(s.activeRoomId).toBe(s.rooms[0].id);
});

test('loadMessagesThunk success fills messages for room', async () => {
  const store = makeStore();
  await store.dispatch(loadRoomsThunk());
  const roomId = (store.getState().chat as any).rooms[0].id;
  await store.dispatch(loadMessagesThunk(roomId));
  const s = store.getState().chat as any;
  expect(s.messagesStatus).toBe('succeeded');
  expect(s.messages.length).toBeGreaterThan(0);
});


