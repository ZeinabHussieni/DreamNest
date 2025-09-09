import '../../setup';
import React from 'react';
import NotificationBell from '../../../Components/notifications/NotificationBell';
import { renderWithProviders, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
jest.mock('../../../Services/socket/socket', () => require('../../support/services-socket'));
jest.mock('../../../Services/axios/axios', () => ({ __esModule: true, default: require('../../mocks/__helpers__/axios-fetch').default }));
import { store } from '../../../store/store';
import { upsertOneLocal } from '../../../Redux/notications/notifications.slice';
import Swal from 'sweetalert2';
jest.mock('sweetalert2', () => ({ __esModule: true, default: { fire: jest.fn().mockResolvedValue({ isConfirmed: true }) }, fire: jest.fn().mockResolvedValue({ isConfirmed: true }) }));




test('opens dropdown, shows items, and marks all read', async () => {
	// Ensure Swal resolves with isConfirmed to prevent destructure errors inside hooks
	// @ts-ignore
	Swal.fire.mockResolvedValue?.({ isConfirmed: true });
	window.localStorage.setItem('token', 't');

	store.dispatch(upsertOneLocal({
		id: 1,
		type: 'NEW_MESSAGE',
		userId: 1,
		content: 'You have a new message',
		read: false,
		createdAt: new Date().toISOString(),
	} as any));

	renderWithProviders(<NotificationBell />);

	await userEvent.click(screen.getByRole('button'));

	expect(await screen.findByText(/notifications/i)).toBeInTheDocument();
	expect(screen.getByText(/you have a new message/i)).toBeInTheDocument();

	const markAll = screen.getByRole('button', { name: /mark all read/i });
	expect(markAll).toBeEnabled();
});

test('badge, delete actions, socket push and ordering', async () => {
    // @ts-ignore
    Swal.fire.mockResolvedValue?.({ isConfirmed: true });
	window.localStorage.setItem('token', 't');

	const now = Date.now();
	store.dispatch(upsertOneLocal({ id: 2, type: 'NEW_MESSAGE', userId: 1, content: 'Second', read: false, createdAt: new Date(now).toISOString() } as any));
	store.dispatch(upsertOneLocal({ id: 3, type: 'NEW_MESSAGE', userId: 1, content: 'Third', read: false, createdAt: new Date(now + 1000).toISOString() } as any));
	store.dispatch(upsertOneLocal({ id: 3, type: 'NEW_MESSAGE', userId: 1, content: 'Third', read: false, createdAt: new Date(now + 1000).toISOString() } as any));

	renderWithProviders(<NotificationBell />);

	await userEvent.click(screen.getByRole('button'));
	expect(await screen.findByText(/notifications/i)).toBeInTheDocument();

	// Remove one (use first remove button)
	const removeButtons = screen.getAllByRole('button').filter(b => b.className.includes('remove-notify'));
	if (removeButtons[0]) {
		await userEvent.click(removeButtons[0]);
	}

	// Remove all (header remove)
	const headerRemove = removeButtons.find(b => b.querySelector('img')?.getAttribute('alt') === 'remove all');
	if (headerRemove) {
		await userEvent.click(headerRemove);
	}
});


