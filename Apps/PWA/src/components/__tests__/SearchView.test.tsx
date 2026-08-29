import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchView } from '../SearchView';
import { useAuth } from '../../context/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { SearchResult, Community } from '../../types';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    fetchSuggestedCommunities: vi.fn(),
    searchEntities: vi.fn(),
    updateUserCommunities: vi.fn(),
  },
}));

describe('SearchView Component', () => {
  const mockUser = {
    id: 'user_test_001',
    username: 'test_yogi#1234',
    displayName: 'Test Yogi',
    lastSearchArea: 'Askew',
    joinedCommunities: ['area_askew'],
    privacySettings: {
      isProfilePublic: false,
      avatarPrivacy: 'groups-only' as const,
      showJoinedGroups: 'members-only' as const,
    },
    createdAt: '2026-03-08T00:00:00Z',
    updatedAt: '2026-03-08T00:00:00Z',
  };

  const mockRefreshUserProfile = vi.fn();

  const mockSuggestions: Community[] = [
    {
      id: 'area_askew',
      name: 'Askew',
      description: 'Community feed for Askew area.',
      location_prefix: 'W12',
      engagementScore: 850,
      privacySettings: { isPublic: true, membersCanPost: true },
    },
    {
      id: 'area_hammersmith',
      name: 'Hammersmith',
      description: 'Yoga in Hammersmith.',
      location_prefix: 'W6',
      engagementScore: 600,
      privacySettings: { isPublic: true, membersCanPost: true },
    },
  ];

  const mockSearchResults: SearchResult[] = [
    {
      id: 'area_hammersmith',
      title: 'Hammersmith',
      subtitle: 'W6 • Yoga in Hammersmith.',
      category: 'area',
      locationPrefix: 'W6',
      metadata: { priority: 1 },
      communityData: mockSuggestions[1],
    },
    {
      id: 'studio_zen_001',
      title: 'Askew Zen Den Studio',
      subtitle: 'W12 • 123 Askew Road',
      category: 'studio',
      locationPrefix: 'W12',
      metadata: { priority: 2 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      refreshUserProfile: mockRefreshUserProfile,
    });
    (firestoreService.fetchSuggestedCommunities as ReturnType<typeof vi.fn>).mockResolvedValue(mockSuggestions);
    (firestoreService.searchEntities as ReturnType<typeof vi.fn>).mockResolvedValue(mockSearchResults);
  });

  it('renders Discovery Mode header and suggested communities list when query is empty', async () => {
    render(<SearchView />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('discovery-header')).toHaveTextContent('Discover Communities');
      expect(screen.getByTestId('discovery-item-area_askew')).toBeInTheDocument();
      expect(screen.getByTestId('discovery-item-area_hammersmith')).toBeInTheDocument();
    });
  });

  it('executes search query and displays search results header with entity badges', async () => {
    render(<SearchView />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Hammersmith' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-results-header')).toHaveTextContent("Results for 'Hammersmith'");
      expect(screen.getByTestId('search-result-item-area_hammersmith')).toBeInTheDocument();
      expect(screen.getByTestId('search-result-item-studio_zen_001')).toBeInTheDocument();
    });

    expect(screen.getByText('AREA')).toBeInTheDocument();
    expect(screen.getByText('STUDIO')).toBeInTheDocument();
  });

  it('handles toggle join community action from search results', async () => {
    render(<SearchView />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Hammersmith' } });

    await waitFor(() => {
      expect(screen.getByTestId('toggle-join-area_hammersmith')).toBeInTheDocument();
    });

    const joinButton = screen.getByTestId('toggle-join-area_hammersmith');
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(firestoreService.updateUserCommunities).toHaveBeenCalledWith('user_test_001', [
        'area_askew',
        'area_hammersmith',
      ]);
      expect(mockRefreshUserProfile).toHaveBeenCalled();
    });
  });

  it('displays empty state fallback when search query returns no results', async () => {
    (firestoreService.searchEntities as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<SearchView />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'NonExistentPlace' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-no-results')).toBeInTheDocument();
      expect(screen.getByTestId('discovery-header')).toHaveTextContent('Communities Near You');
    });
  });
});
