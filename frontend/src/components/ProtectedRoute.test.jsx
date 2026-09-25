import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';

function renderRoute(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Login page</div>} />
        <Route path="/secure" element={<ProtectedRoute><div>Secure page</div></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => localStorage.clear());

  it('redirects unauthenticated visitors to login', () => {
    renderRoute('/secure');
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders the protected page for an authenticated visitor', () => {
    localStorage.setItem('token', 'test-token');
    renderRoute('/secure');
    expect(screen.getByText('Secure page')).toBeInTheDocument();
  });
});
