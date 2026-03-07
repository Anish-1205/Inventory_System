import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock('@/lib/auth/token-manager', () => ({
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

vi.mock('@inventory-saas/shared', () => ({
  LoginSchema: {
    safeParse: vi.fn((data) => {
      if (!data.email || !data.password) {
        return {
          success: false,
          error: { errors: [{ message: 'Validation error' }] },
        };
      }
      return { success: true, data };
    }),
  },
}));

import LoginPage from '@/app/(auth)/login/page';
import { apiClient } from '@/lib/api/client';
import { setAccessToken } from '@/lib/auth/token-manager';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in heading', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not show an error message initially', () => {
    render(<LoginPage />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls apiClient.post on form submission with valid data', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { accessToken: 'tok_123' } },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('stores the access token after a successful login', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { accessToken: 'tok_abc' } },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(setAccessToken).toHaveBeenCalledWith('tok_abc');
    });
  });

  it('shows an error message when the API returns an error', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows a fallback error when the API error has no message', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'somepass');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  it('disables the submit button while loading', async () => {
    let resolveLogin: (v: unknown) => void;
    vi.mocked(apiClient.post).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    resolveLogin!({ data: { data: { accessToken: 'tok' } } });
  });
});
