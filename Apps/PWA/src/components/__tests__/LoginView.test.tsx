import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginView } from '../LoginView';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    loginWithGoogle: vi.fn().mockResolvedValue({ uid: 'user_123' }),
    sendSignInLink: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('LoginView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google sign-in button and email input field', () => {
    render(<LoginView />);

    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-link-button')).toBeDisabled();
  });

  it('enables send button when valid email is entered', () => {
    render(<LoginView />);

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    expect(screen.getByTestId('send-link-button')).not.toBeDisabled();
  });

  it('triggers sendMagicLink and starts 60s cooldown on submit', async () => {
    render(<LoginView />);

    const emailInput = screen.getByTestId('email-input');
    const sendButton = screen.getByTestId('send-link-button');

    fireEvent.change(emailInput, { target: { value: 'test@inspired.app' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(authService.sendSignInLink).toHaveBeenCalledWith('test@inspired.app');
      expect(screen.getByTestId('magic-link-sent')).toBeInTheDocument();
      expect(screen.getByTestId('send-link-button')).toBeDisabled();
      expect(screen.getByTestId('send-link-button').textContent).toContain('Resend link in 60s');
    });
  });

  it('triggers loginWithGoogle when Google button is clicked', async () => {
    render(<LoginView />);

    const googleButton = screen.getByTestId('google-login-button');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(authService.loginWithGoogle).toHaveBeenCalledTimes(1);
    });
  });
});
