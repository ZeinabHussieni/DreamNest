import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';

let BrowserRouter: any, MemoryRouter: any;
try {
	
	const rrd = require('react-router-dom');
	BrowserRouter = rrd.BrowserRouter;
	MemoryRouter = rrd.MemoryRouter;
} catch {
	const shim = require('./mocks/react-router-dom');
	BrowserRouter = shim.BrowserRouter;
	MemoryRouter = shim.MemoryRouter;
}
import { render, RenderOptions } from '@testing-library/react';

jest.mock('../Services/socket/socket', () => require('./support/services-socket'));
jest.mock('../Services/axios/axios', () => ({ __esModule: true, default: require('./mocks/__helpers__/axios-fetch').default }));
jest.mock('react-router-dom', () => require('./mocks/react-router-dom'), { virtual: true });
import { AuthProvider } from '../Context/AuthContext';
import { ThemeProvider } from '../Context/ThemeContext';
import { store } from '../store/store';
import { ToastContainer } from 'react-toastify';

type WrapperProps = {
	children: React.ReactNode;
	useBrowserRouter?: boolean;
};

function AppProviders({ children, useBrowserRouter }: WrapperProps) {
	const Router = useBrowserRouter ? BrowserRouter : MemoryRouter;
	return (
		<AuthProvider>
			<Router>
				<ToastContainer />
				<ThemeProvider>
					<Provider store={store}>{children}</Provider>
				</ThemeProvider>
			</Router>
		</AuthProvider>
	);
}

export function renderWithProviders(
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'> & { useBrowserRouter?: boolean }
) {
	const { useBrowserRouter, ...rest } = options || {};
	return render(ui, {
		wrapper: ({ children }) => (
			<AppProviders useBrowserRouter={useBrowserRouter}>{children}</AppProviders>
		),
		...rest,
	});
}

export * from '@testing-library/react';


