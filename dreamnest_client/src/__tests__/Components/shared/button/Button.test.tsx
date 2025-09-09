import '../../../setup';
import React from 'react';
jest.mock('../../../../Services/axios/axios', () => ({ __esModule: true, default: {} }));
jest.mock('../../../../Services/socket/socket', () => require('../../../mocks/services-socket'));
import Button from '../../../../Components/shared/button/Button';
import { render, screen } from '../../../test-utils';

test('renders Button with provided text', () => {
  render(<Button text="Click me" />);
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
});


