import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingView } from '../OnboardingView';
import { firestoreService } from '../../services/firestoreService';

const mockCompleteOnboarding = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    onboardingUserId: 'user_new_999',
    onboardingDisplayName: 'Maya',
    completeOnboarding: mockCompleteOnboarding,
  }),
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    validateDisplayName: vi.fn().mockResolvedValue(true),
    createUserProfile: vi.fn().mockResolvedValue(undefined),
  },
  ProfileValidationError: class ProfileValidationError extends Error {
    constructor(public reason: string) {
      super(reason);
      this.name = 'ProfileValidationError';
    }
  },
}));

describe('OnboardingView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders display name prefilled and handle formatted as name#XXXX', () => {
    render(<OnboardingView />);

    const displayNameInput = screen.getByTestId('display-name-input') as HTMLInputElement;
    const handleInput = screen.getByTestId('proposed-handle-input') as HTMLInputElement;

    expect(displayNameInput.value).toBe('Maya');
    expect(handleInput.value).toMatch(/^maya#\d{4}$/);
    expect(screen.getByTestId('confirm-profile-button')).not.toBeDisabled();
  });

  it('updates handle in real-time when user types display name', () => {
    render(<OnboardingView />);

    const displayNameInput = screen.getByTestId('display-name-input');
    fireEvent.change(displayNameInput, { target: { value: 'Jane Doe' } });

    const handleInput = screen.getByTestId('proposed-handle-input') as HTMLInputElement;
    expect(handleInput.value).toMatch(/^jane_doe#\d{4}$/);
  });

  it('disables submit button when display name is under 2 characters', () => {
    render(<OnboardingView />);

    const displayNameInput = screen.getByTestId('display-name-input');
    fireEvent.change(displayNameInput, { target: { value: 'A' } });

    expect(screen.getByTestId('confirm-profile-button')).toBeDisabled();
  });

  it('calls validateDisplayName and createUserProfile on submit', async () => {
    render(<OnboardingView />);

    const displayNameInput = screen.getByTestId('display-name-input');
    fireEvent.change(displayNameInput, { target: { value: 'Maya Lin' } });

    const submitButton = screen.getByTestId('confirm-profile-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(firestoreService.validateDisplayName).toHaveBeenCalledWith('Maya Lin');
      expect(firestoreService.createUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user_new_999',
          displayName: 'Maya Lin',
          username: expect.stringMatching(/^maya_lin#\d{4}$/),
        })
      );
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });
  });
});
