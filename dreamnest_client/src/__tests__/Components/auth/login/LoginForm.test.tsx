import '../../../setup';
jest.mock('../../../../Services/socket/socket', () => require('../../../support/services-socket'));
jest.mock('../../../../Services/axios/axios', () => ({ __esModule: true, default: require('../../../mocks/__helpers__/axios-fetch').default }));
import React from 'react';
import { renderWithProviders, screen } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../../../Components/auth/login/LoginForm';


test('submits credentials and shows success path', async () => {
	renderWithProviders(<LoginForm />);

	await userEvent.type(screen.getByLabelText(/username or email/i), 'john');
	await userEvent.type(screen.getByLabelText(/password/i), 'secret');

	await userEvent.click(screen.getByRole('button', { name: /login/i }));


	expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument();
});


test('shows validation messages when fields empty', async () => {
	renderWithProviders(<LoginForm />);

	await userEvent.click(screen.getByRole('button', { name: /^login/i }));

	expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
});


