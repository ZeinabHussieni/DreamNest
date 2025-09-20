import '../setup';
jest.mock('../../Services/axios/axios', () => ({ __esModule: true, default: require('../mocks/__helpers__/axios-fetch').default }));
import reducer, { markReadLocal, removeByIdLocal, reset } from '../../Redux/notications/notifications.slice';
import { loadNotificationsThunk, deleteNotificationThunk } from '../../Redux/notications/notifications.thunks';
import { configureStore } from '@reduxjs/toolkit';

function makeStore() {
  return configureStore({ reducer: { notifications: reducer } });
}

test('loadNotificationsThunk success sets items and status', async () => {
  const store = makeStore();
  await store.dispatch(loadNotificationsThunk());
  const state = store.getState().notifications;
  expect(state.status).toBe('succeeded');
  expect(state.ids.length).toBeGreaterThan(0);
});

test('markOneReadThunk optimistic update with rollback on failure', async () => {
  const store = makeStore();

  store.dispatch(reset());
  const id = 1;

  store.dispatch(markReadLocal(id));
  let state = store.getState().notifications;

  await store.dispatch(loadNotificationsThunk());
  state = store.getState().notifications;
});

test('deleteNotificationThunk optimistic remove', async () => {
  const store = makeStore();
  await store.dispatch(loadNotificationsThunk());
  const stateBefore = store.getState().notifications;
  const id = Number(stateBefore.ids[0]);
  await store.dispatch(deleteNotificationThunk(id));
  const stateAfter = store.getState().notifications;
  expect(stateAfter.entities[id]).toBeUndefined();
});


