import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JoinedCommunitiesView } from '../JoinedCommunitiesView';
import { firestoreService } from '../../services/firestoreService';

const mockRefreshUserProfile = vi.fn().mockResolvedValue(undefined);

let mockUser = {
  id: 'user_123',
  username: 'yoga_jane#1234',
  joinedCommunities: ['comm_ravenscourt_yoga'],
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshUserProfile: mockRefreshUserProfile,
  }),
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    fetchCommunitiesByIds: vi.fn(),
    fetchSuggestedCommunities: vi.fn(),
    updateUserCommunities: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockJoinedCommunity = {
  id: 'comm_ravenscourt_yoga',
  name: 'Ravenscourt Park Yoga',
  description: 'Outdoor sessions',
  location_prefix: 'W6',
  engagementScore: 450,
  privacySettings: { isPublic: true, membersCanPost: true },
};

const mockSuggestedCommunity = {
  id: 'area_chelsea',
  name: 'Chelsea Yoga',
  description: 'Chelsea sessions',
  location_prefix: 'SW3',
  engagementScore: 1200,
  privacySettings: { isPublic: true, membersCanPost: true },
};

describe('JoinedCommunitiesView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders joined communities when user has joined communities', async () => {
    vi.spyOn(firestoreService, 'fetchCommunitiesByIds').mockResolvedValue([mockJoinedCommunity] as any);

    render(<JoinedCommunitiesView />);

    await waitFor(() => {
      expect(screen.getByTestId('joined-community-comm_ravenscourt_yoga')).toBeInTheDocument();
      expect(screen.getByText('Ravenscourt Park Yoga')).toBeInTheDocument();
      expect(screen.getByTestId('joined-badge-comm_ravenscourt_yoga')).toBeInTheDocument();
      expect(screen.getByTestId('leave-button-comm_ravenscourt_yoga')).toBeInTheDocument();
    });
  });

  it('triggers leave action and updates user communities on leave click', async () => {
    vi.spyOn(firestoreService, 'fetchCommunitiesByIds').mockResolvedValue([mockJoinedCommunity] as any);

    render(<JoinedCommunitiesView />);

    await waitFor(() => {
      expect(screen.getByTestId('leave-button-comm_ravenscourt_yoga')).toBeInTheDocument();
    });

    const leaveButton = screen.getByTestId('leave-button-comm_ravenscourt_yoga');
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(firestoreService.updateUserCommunities).toHaveBeenCalledWith('user_123', []);
      expect(mockRefreshUserProfile).toHaveBeenCalledTimes(1);
    });
  });

  it('renders empty state and suggestions when user has 0 joined communities', async () => {
    mockUser = {
      id: 'user_123',
      username: 'yoga_jane#1234',
      joinedCommunities: [],
    };

    vi.spyOn(firestoreService, 'fetchSuggestedCommunities').mockResolvedValue([mockSuggestedCommunity] as any);

    render(<JoinedCommunitiesView />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-communities-container')).toBeInTheDocument();
      expect(screen.getByTestId('suggested-community-area_chelsea')).toBeInTheDocument();
    });
  });
});
