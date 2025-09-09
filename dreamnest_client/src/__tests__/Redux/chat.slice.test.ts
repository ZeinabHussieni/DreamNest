import '../setup';
jest.mock('../../Services/axios/axios', () => ({ __esModule: true, default: {} }));
jest.mock('../../Services/chat/chatService', () => ({
  getChatRooms: async () => [{ id: 10 }],
  getRoomMessages: async () => [{ id: 1, content: 'hi', chatRoomId: 10 }],
}));
import reducer, {
  setActiveRoomId,
  appendMessageIfActive,
} from '../../Redux/chat/chat.slice';

test('chat reducers: set active and append gated by active', () => {
  const initial = reducer(undefined as any, { type: 'init' });
  const withRooms = {
    ...initial,
    rooms: [{ id: 10 }],
  } as any;
  const active = reducer(withRooms, setActiveRoomId(10));
  const msg = { id: 1, content: 'hi', chatRoomId: 10 } as any;
  const appended = reducer(active, appendMessageIfActive(msg));
  expect(appended.messages).toHaveLength(1);

  const otherMsg = { id: 2, content: 'no', chatRoomId: 999 } as any;
  const unchanged = reducer(appended, appendMessageIfActive(otherMsg));
  expect(unchanged.messages).toHaveLength(1);
});


