import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>
}), { virtual: true });

import Login from './pages/desktop/login/login';
import { MemoryRouter } from 'react-router-dom';

test('renders login button', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
  const button = screen.getByRole('button', { name: /دخول/i });
  expect(button).toBeInTheDocument();
});
