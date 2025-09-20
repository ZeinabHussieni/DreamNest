import '../setup';
jest.mock('../../Services/socket/socket', () => require('../support/services-socket'));
jest.mock('../../Services/axios/axios', () => ({ __esModule: true, default: require('../mocks/__helpers__/axios-fetch').default }));
import React from 'react';
import { renderWithProviders, screen } from '../test-utils';
import { useAuth } from '../../Context/AuthContext';

function Probe() {
	const { isAuthenticated, login, logout } = useAuth();
	return (
		<div>
			<span>auth:{String(isAuthenticated)}</span>
			<button onClick={() => login('t', { id: 1, userName: 'john' })}>login</button>
			<button onClick={() => logout()}>logout</button>
		</div>
	);
}

test('AuthContext toggles on login/logout and touches localStorage', async () => {
	window.localStorage.clear();
	renderWithProviders(<Probe />);

	expect(screen.getByText(/auth:false/i)).toBeInTheDocument();

	await (await import('@testing-library/react')).act(async () => {
		screen.getByText('login').click();
	});
	expect(screen.getByText(/auth:true/i)).toBeInTheDocument();
	expect(window.localStorage.getItem('token')).toBe('t');
	expect(window.localStorage.getItem('user')).toBeTruthy();

	await (await import('@testing-library/react')).act(async () => {
		screen.getByText('logout').click();
	});
	expect(screen.getByText(/auth:false/i)).toBeInTheDocument();
	expect(window.localStorage.getItem('token')).toBeNull();
});


