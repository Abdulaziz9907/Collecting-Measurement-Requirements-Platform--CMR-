import { render, screen } from '@testing-library/react';
import Login from './pages/desktop/login/login';

test('renders login button', () => {
  render(<Login />);
  const button = screen.getByRole('button', { name: /دخول/i });
  expect(button).toBeInTheDocument();
});
