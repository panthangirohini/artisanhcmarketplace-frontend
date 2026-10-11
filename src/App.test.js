import { render, screen } from '@testing-library/react';
import App from './App';

// Stub the backend so tests don't make real network calls.
// Plain functions (not jest.fn) so CRA's resetMocks doesn't wipe them between tests.
jest.mock('./Api', () => {
  const ok = (data) => () => Promise.resolve({ data });
  return {
    __esModule: true,
    API_URL: 'http://test',
    default: { get: ok([]), post: ok({}), put: ok({}), delete: ok({}) },
  };
});

beforeEach(() => localStorage.clear());

test('shows the login page when no user is signed in', () => {
  render(<App />);
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
});

test('restores a saved customer session to the products page', () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Asha', role: 'CUSTOMER' }));
  render(<App />);
  expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
});
