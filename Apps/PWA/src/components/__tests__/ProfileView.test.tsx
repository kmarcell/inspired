import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileView } from '../ProfileView';
import { firestoreService } from '../../services/firestoreService';

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockRefreshUserProfile = vi.fn().mockResolvedValue(undefined);

const mockUser = {
  id: 'user_123',
  username: 'maya_sharma#8522',
  displayName: 'Maya Sharma',
  bio: 'Yoga teacher in London.',
  joinedCommunities: ['area_askew'],
  privacySettings: {
    isProfilePublic: false,
    avatarPrivacy: 'groups-only' as const,
    showJoinedGroups: 'members-only' as const,
  },
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    refreshUserProfile: mockRefreshUserProfile,
  }),
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    updateUserProfile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('ProfileView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user details correctly', () => {
    render(<ProfileView />);

    expect(screen.getByText('Maya Sharma')).toBeInTheDocument();
    expect(screen.getByText('@maya_sharma#8522')).toBeInTheDocument();
    expect(screen.getByTestId('bio-textarea')).toHaveValue('Yoga teacher in London.');
  });

  it('saves bio updates when submitting bio form', async () => {
    render(<ProfileView />);

    const textarea = screen.getByTestId('bio-textarea');
    fireEvent.change(textarea, { target: { value: 'Updated bio for testing.' } });

    const saveButton = screen.getByTestId('save-bio-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(firestoreService.updateUserProfile).toHaveBeenCalledWith('user_123', {
        bio: 'Updated bio for testing.',
      });
      expect(mockRefreshUserProfile).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('profile-feedback')).toHaveTextContent('Bio updated successfully!');
    });
  });

  it('updates privacy settings when submitting privacy form', async () => {
    render(<ProfileView />);

    const publicToggle = screen.getByTestId('toggle-public-profile');
    fireEvent.click(publicToggle);

    const savePrivacyButton = screen.getByTestId('save-privacy-button');
    fireEvent.click(savePrivacyButton);

    await waitFor(() => {
      expect(firestoreService.updateUserProfile).toHaveBeenCalledWith('user_123', {
        privacySettings: {
          isProfilePublic: true,
          avatarPrivacy: 'public',
          showJoinedGroups: 'members-only',
        },
      });
      expect(mockRefreshUserProfile).toHaveBeenCalledTimes(1);
    });
  });

  it('calls logout when clicking logout button', () => {
    render(<ProfileView />);

    const logoutBtn = screen.getByTestId('logout-button');
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
