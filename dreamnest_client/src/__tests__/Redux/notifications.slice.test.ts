import '../setup';
jest.mock('../../Services/axios/axios', () => ({ __esModule: true, default: {} }));
jest.mock('../../Services/socket/notificationsSocket', () => ({
  fetchNotifications: async () => [],
  markRead: async () => ({}),
  markAllRead: async () => undefined,
  deleteNotificationById: async () => undefined,
  deleteAllForUser: async () => undefined,
}));
import reducer, {
  markReadLocal,
  markAllReadLocal,
  upsertOneLocal,
  removeByIdLocal,
} from '../../Redux/notications/notifications.slice';

test('notifications reducers update state predictably', () => {
  const initial = reducer(undefined as any, { type: 'init' });
  const added = reducer(initial, upsertOneLocal({
    id: 1,
    type: 'NEW_MESSAGE',
    content: 'hi',
    userId: 1,
    read: false,
    createdAt: new Date().toISOString(),
  } as any));
  expect(Object.values(added.entities).length).toBe(1);

  const marked = reducer(added, markReadLocal(1));
  expect(marked.entities[1]?.read).toBe(true);

  const allRead = reducer(marked, markAllReadLocal());
  expect(Object.values(allRead.entities).every((n: any) => n?.read)).toBe(true);

  const removed = reducer(allRead, removeByIdLocal(1));
  expect(Object.values(removed.entities).length).toBe(0);
});


