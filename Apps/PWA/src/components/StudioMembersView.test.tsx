import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudioMembersView } from './StudioMembersView';
import { firestoreService } from '../services/firestoreService';
import { StudioMember } from '../types';

vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    fetchStudioMembers: vi.fn(),
  },
}));

const mockMembers: StudioMember[] = [
  { id: 'user_public_1', displayName: 'Maryia Sharma', isProfilePublic: true, joinedAt: '2026-01-15T10:00:00Z' },
  { id: 'user_private_1', displayName: 'Anonymous Yogi #42', isProfilePublic: false, joinedAt: '2026-02-10T09:15:00Z' },
];

describe('StudioMembersView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firestoreService.fetchStudioMembers).mockResolvedValue(mockMembers);
  });

  it('renders member directory and privacy guard badges', async () => {
    render(
      <StudioMembersView
        studioId="studio_askew_001"
        studioName="Askew Road Zen Den"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Maryia Sharma')).toBeInTheDocument();
    });

    expect(screen.getByText('Anonymous Yogi #42')).toBeInTheDocument();
    expect(screen.getByText(/Public Profile ➔/i)).toBeInTheDocument();
    expect(screen.getByText(/🔒 Private Profile/i)).toBeInTheDocument();
  });

  it('allows clicking public profile row but ignores private profile row click', async () => {
    const handleSelectProfile = vi.fn();
    render(
      <StudioMembersView
        studioId="studio_askew_001"
        studioName="Askew Road Zen Den"
        onClose={vi.fn()}
        onSelectMemberProfile={handleSelectProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Maryia Sharma')).toBeInTheDocument();
    });

    // Click public member row
    fireEvent.click(screen.getByTestId('member-row-user_public_1'));
    expect(handleSelectProfile).toHaveBeenCalledWith('user_public_1');

    // Click private member row
    handleSelectProfile.mockClear();
    fireEvent.click(screen.getByTestId('member-row-user_private_1'));
    expect(handleSelectProfile).not.toHaveBeenCalled();
  });
});
