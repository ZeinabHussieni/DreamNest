import '../setup';
jest.mock('../../Services/axios/axios', () => ({ __esModule: true, default: require('../mocks/__helpers__/axios-fetch').default }));
jest.mock('../../Services/socket/socket', () => require('../support/services-socket'));
import React from 'react';
import { renderWithProviders, screen } from '../test-utils';

let MemoryRouter: any, Routes: any, Route: any;
try {
	const rrd = require('react-router-dom');
	MemoryRouter = rrd.MemoryRouter;
	Routes = rrd.Routes;
	Route = rrd.Route;
} catch {
	const shim = require('../mocks/react-router-dom');
	MemoryRouter = shim.MemoryRouter;
	Routes = shim.Routes;
	Route = shim.Route;
}

function Dummy() {
	return <div>OK</div>;
}

test('ProtectedRoute redirects when not authenticated', async () => {
	window.localStorage.removeItem('token');
	renderWithProviders(
		<MemoryRouter initialEntries={['/private']}>
			<Routes>
				<Route element={React.createElement(require('../../Routes/guards').ProtectedRoute.default || require('../../Routes/guards').ProtectedRoute)}>
					<Route path="/private" element={<Dummy />} />
				</Route>
				<Route path="/login" element={<div>Login Page</div>} />
			</Routes>
		</MemoryRouter>
	);
	expect(await screen.findByText(/login page/i)).toBeInTheDocument();
});

test('GuestRoute redirects when authenticated', async () => {
	window.localStorage.setItem('token', 'x');
	renderWithProviders(
		<MemoryRouter initialEntries={['/login']}>
			<Routes>
				<Route element={React.createElement(require('../../Routes/guards').GuestRoute.default || require('../../Routes/guards').GuestRoute)}>
					<Route path="/login" element={<div>Login Page</div>} />
				</Route>
				<Route path="/dashboard" element={<div>Dashboard</div>} />
			</Routes>
		</MemoryRouter>
	);
	// With our router mock, redirects render as "Navigate:/dashboard" text.
	expect(await screen.findByText(/Navigate:\s*\/dashboard/i)).toBeInTheDocument();
	window.localStorage.removeItem('token');
});


