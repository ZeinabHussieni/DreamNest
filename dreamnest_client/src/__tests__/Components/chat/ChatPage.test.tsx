import '../../setup';
import React from 'react';
import ChatPage from '../../../Components/chat/ChatPage';
import { renderWithProviders, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
jest.mock('../../../Services/socket/socket', () => require('../../support/services-socket'));
jest.mock('../../../Services/axios/axios', () => ({ __esModule: true, default: require('../../mocks/__helpers__/axios-fetch').default }));

import { store } from '../../../store/store';
import { setActiveRoomId, appendMessageIfActive } from '../../../Redux/chat/chat.slice';


test('loads rooms and messages, allows typing when room active', async () => {
	window.localStorage.setItem('token', 't');
	window.localStorage.setItem('user', JSON.stringify({ id: 1, userName: 'me' }));

	renderWithProviders(<ChatPage />);


	expect(screen.getAllByText(/conversations/i)[0]).toBeInTheDocument();

	
	expect(await screen.findByText(/welcome to general/i)).toBeInTheDocument();
	await (await import('@testing-library/react')).act(async () => {
		store.dispatch(setActiveRoomId(10));
		store.dispatch(appendMessageIfActive({
			id: 101,
			content: 'Echo: Hello',
			createdAt: new Date().toISOString(),
			senderId: 2,
			chatRoomId: 10,
		} as any));
	});

	expect(await screen.findByText(/echo: hello/i)).toBeInTheDocument();

	const input = screen.getByPlaceholderText(/type a message/i);
	await userEvent.type(input, 'Hello{enter}');
});


test('switch rooms stops appending to old room', async () => {
	window.localStorage.setItem('token', 't');
	window.localStorage.setItem('user', JSON.stringify({ id: 1, userName: 'me' }));

	renderWithProviders(<ChatPage />);


	expect(await screen.findByText(/welcome to general/i)).toBeInTheDocument();

	await (await import('@testing-library/react')).act(async () => {
		store.dispatch(setActiveRoomId(10));
		store.dispatch(appendMessageIfActive({ id: 201, content: 'Msg in 10', createdAt: new Date().toISOString(), senderId: 2, chatRoomId: 10 } as any));
	});
	expect(await screen.findByText(/msg in 10/i)).toBeInTheDocument();

	await (await import('@testing-library/react')).act(async () => {
		store.dispatch(setActiveRoomId(999));
		store.dispatch(appendMessageIfActive({ id: 202, content: 'Should not show in 10', createdAt: new Date().toISOString(), senderId: 2, chatRoomId: 10 } as any));
	});
	expect(screen.queryByText(/should not show in 10/i)).toBeNull();
});


