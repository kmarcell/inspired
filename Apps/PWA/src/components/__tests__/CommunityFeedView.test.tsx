import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunityFeedView } from '../CommunityFeedView';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user_123',
      username: 'yoga_jane#1234',
      joinedCommunities: ['comm_askew'],
    },
  }),
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    detectNearestArea: vi.fn().mockResolvedValue('Askew'),
    fetchFeed: vi.fn(),
    fetchSuggestedCommunities: vi.fn(),
  },
}));

const mockPosts = [
  {
    id: 'post_001',
    author: { id: 'auth_1', username: 'yoga_maya#1001', avatarPrivacy: 'public' },
    content: 'Morning yoga session at Askew Park! 🧘‍♀️',
    source: { type: 'area', name: 'Askew' },
    stats: { likeCount: 12, commentCount: 3 },
    createdAt: '2026-08-28T09:00:00.000Z',
  },
];

const mockCommunities = [
  {
    id: 'comm_001',
    name: 'Ravenscourt Park Yoga',
    description: 'Outdoor park sessions',
    location_prefix: 'W6',
    engagementScore: 100,
    privacySettings: { isPublic: true, membersCanPost: true },
  },
];

describe('CommunityFeedView & FeedPostTile Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders posts from Tier 1 (30 days) when posts are available', async () => {
    vi.spyOn(firestoreService, 'fetchFeed').mockResolvedValue(mockPosts as any);

    render(<CommunityFeedView />);

    await waitFor(() => {
      expect(screen.getByTestId('post-tile-post_001')).toBeInTheDocument();
      expect(screen.getByText('yoga_maya#1001')).toBeInTheDocument();
      expect(screen.getByText('Morning yoga session at Askew Park! 🧘‍♀️')).toBeInTheDocument();
      expect(screen.getByTestId('source-badge').textContent).toContain('Askew');
    });
  });

  it('triggers Tier 3 (Discovery Mode) when 30d and 180d queries return empty arrays', async () => {
    // 30d -> empty, 180d -> empty
    vi.spyOn(firestoreService, 'fetchFeed').mockResolvedValue([]);
    vi.spyOn(firestoreService, 'fetchSuggestedCommunities').mockResolvedValue(mockCommunities as any);

    render(<CommunityFeedView />);

    await waitFor(() => {
      expect(screen.getByTestId('discovery-mode-container')).toBeInTheDocument();
      expect(screen.getByTestId('suggested-community-comm_001')).toBeInTheDocument();
      expect(screen.getByText('Ravenscourt Park Yoga')).toBeInTheDocument();
    });
  });

  it('toggles post like count when like button is clicked', async () => {
    vi.spyOn(firestoreService, 'fetchFeed').mockResolvedValue(mockPosts as any);

    render(<CommunityFeedView />);

    await waitFor(() => {
      expect(screen.getByTestId('post-tile-post_001')).toBeInTheDocument();
    });

    const likeButton = screen.getByTestId('like-button-post_001');
    expect(likeButton.textContent).toContain('12');

    fireEvent.click(likeButton);
    await waitFor(() => {
      expect(screen.getByTestId('like-button-post_001').textContent).toContain('13');
    });

    fireEvent.click(screen.getByTestId('like-button-post_001'));
    await waitFor(() => {
      expect(screen.getByTestId('like-button-post_001').textContent).toContain('12');
    });
  });
});
