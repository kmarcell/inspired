import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudioProfileView } from './StudioProfileView';
import { firestoreService } from '../services/firestoreService';
import { YogaStudio, UserProfile } from '../types';

vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    fetchStudioClasses: vi.fn().mockResolvedValue([]),
    fetchStudioMembers: vi.fn().mockResolvedValue([]),
    fetchFeed: vi.fn().mockResolvedValue([]),
    joinStudioWithParentBrand: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user_123',
      username: 'yogi_test#1234',
      displayName: 'Test Yogi',
      isProfilePublic: true,
      joinedCommunities: ['comm_area_W12'],
    },
    status: 'authenticated',
    logout: vi.fn(),
    refreshUserProfile: vi.fn(),
  }),
}));

const mockStudio: YogaStudio = {
  id: 'studio_askew_001',
  name: 'Askew Road Zen Den',
  address: '142 Askew Road, London W12 9SHA',
  about: 'Heated flows & restorative zen sessions daily.',
  rating: 4.9,
  isClaimed: true,
  status: 'active',
  reviewCount: 42,
  membersCount: 148,
  location_prefix: 'W12',
  engagementScore: 850,
  parentBrandName: 'Affordable London Yoga',
  parentBrandCommunityId: 'comm_brand_affordable_london',
  contactEmail: 'hello@askewzen.com',
  contactPhone: '+44 20 7946 0912',
  websiteUrl: 'https://askewzen.com',
  moderationSettings: { autoApproveMemberComments: true, guestCommentsEnabled: true },
  location: { lat: 51.5033, lng: -0.2277 },
};

const mockUser: UserProfile = {
  id: 'user_123',
  username: 'yogi_test#1234',
  displayName: 'Test Yogi',
  isProfilePublic: true,
  privacySettings: { isProfilePublic: true, avatarPrivacy: 'groups-only', showJoinedGroups: 'members-only' },
  joinedCommunities: ['comm_area_W12'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('StudioProfileView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders studio details, operating status, and horizontal teachers section', async () => {
    render(
      <StudioProfileView
        studio={mockStudio}
        currentUser={mockUser}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Askew Road Zen Den')).toBeInTheDocument();
    expect(screen.getByText('🟢 Open')).toBeInTheDocument();
    expect(screen.getByText('🏢 Affordable London Yoga')).toBeInTheDocument();
    expect(screen.getByText(/👥 148 Members ➔/i)).toBeInTheDocument();
    expect(screen.getByText(/Maryia Sharma/i)).toBeInTheDocument();
  });

  it('triggers cascading join when Join Studio button is clicked', async () => {
    const handleUpdateUser = vi.fn();
    vi.mocked(firestoreService.joinStudioWithParentBrand).mockResolvedValue({
      ...mockUser,
      joinedCommunities: ['comm_area_W12', 'comm_studio_studio_askew_001', 'comm_brand_affordable_london'],
    });

    render(
      <StudioProfileView
        studio={mockStudio}
        currentUser={mockUser}
        onBack={vi.fn()}
        onUpdateCurrentUser={handleUpdateUser}
      />
    );

    const joinBtn = screen.getByText('＋ Join Studio');
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(firestoreService.joinStudioWithParentBrand).toHaveBeenCalledWith(
        'studio_askew_001',
        'comm_brand_affordable_london',
        mockUser
      );
    });

    expect(handleUpdateUser).toHaveBeenCalled();
  });

  it('switches tabs between Schedule and Community Feed and displays privacy lock for unjoined users', () => {
    render(
      <StudioProfileView
        studio={mockStudio}
        currentUser={mockUser}
        onBack={vi.fn()}
      />
    );

    const feedTab = screen.getByText('💬 Studio Community Feed');
    fireEvent.click(feedTab);

    expect(screen.getByText('💬 Studio Community Feed')).toHaveClass('bg-indigo-600');
    expect(screen.getByText('Members-Only Studio Feed')).toBeInTheDocument();
    expect(screen.getByText('＋ Join Studio to Unlock Feed')).toBeInTheDocument();
  });

  it('renders unactionable Joined Studio status badge and ellipsis options menu when joined', () => {
    const joinedUser: UserProfile = {
      ...mockUser,
      joinedCommunities: ['comm_studio_studio_askew_001'],
    };

    render(
      <StudioProfileView
        studio={mockStudio}
        currentUser={joinedUser}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId('joined-studio-badge')).toBeInTheDocument();
    expect(screen.getByText('✓ Joined Studio')).toBeInTheDocument();

    // Dropdown should be initially closed
    expect(screen.queryByTestId('leave-studio-btn')).not.toBeInTheDocument();

    // Click ellipsis menu trigger
    fireEvent.click(screen.getByTestId('studio-menu-trigger'));
    expect(screen.getByTestId('leave-studio-btn')).toBeInTheDocument();

    // Click tapaway backdrop to close
    fireEvent.click(screen.getByTestId('studio-menu-backdrop'));
    expect(screen.queryByTestId('leave-studio-btn')).not.toBeInTheDocument();
  });
});
