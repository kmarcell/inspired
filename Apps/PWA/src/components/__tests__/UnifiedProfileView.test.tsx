import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UnifiedProfileView, UnifiedProfileData } from '../UnifiedProfileView';
import { UserProfile } from '../../types';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    fetchUserPasses: vi.fn(),
    fetchStudioCurrencyPolicy: vi.fn(),
    bookClassWithPass: vi.fn(),
  },
}));

const mockCurrentUser: UserProfile = {
  id: 'user_123',
  username: 'test_yogi',
  joinedCommunities: ['comm_1'],
  privacySettings: {
    isProfilePublic: true,
    avatarPrivacy: 'public',
    showJoinedGroups: 'public',
  },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const mockTeacherProfile: UnifiedProfileData = {
  id: 'user_teacher_001',
  variant: 'user',
  name: 'Elena Rostova',
  username: 'elena_ashtanga',
  bio: 'Passionate Ashtanga teacher in West London.',
  location_prefix: 'W4, W12, W5, N1',
  isTeacher: true,
  isVerified: true,
  isProfilePublic: true,
  subscriberCount: 342,
  postCount: 58,
  teachingStudios: [
    { id: 'st_1', name: 'Chiswick Hot Yoga Studio', location_prefix: 'W4' },
    { id: 'st_2', name: 'Askew Road Zen Den', location_prefix: 'W12' },
  ],
  classes: [
    {
      id: 'cls_1',
      studioId: 'st_1',
      studioName: 'Chiswick Hot Yoga Studio',
      className: 'Sunset Hot Ashtanga Flow',
      title: 'Sunset Hot Ashtanga Flow',
      classTypeDescription: 'Hot Ashtanga Flow',
      dayOfWeek: 1,
      teacherId: 'user_teacher_001',
      teacherName: 'Elena Rostova',
      dateString: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:15',
      roomClimate: 'hot_studio',
      capacity: 20,
      maxCapacity: 20,
      bookedCount: 5,
      waitlist: [],
    },
  ],
};

const mockBrandProfile: UnifiedProfileData = {
  id: 'comm_brand_001',
  variant: 'brand',
  name: 'Affordable London Yoga',
  bio: 'Connecting yogis with budget-friendly classes.',
  location_prefix: 'W12',
  subscriberCount: 1240,
  postCount: 142,
  studioBranches: [
    {
      id: 'st_1',
      name: 'Chiswick Hot Yoga Studio',
      address: '45 Chiswick High Rd',
      location_prefix: 'W4',
      status: 'open',
    },
  ],
};

describe('UnifiedProfileView', () => {
  it('renders personal teacher profile with 2-item metrics bar and truncated multi-postcode badge', () => {
    render(<UnifiedProfileView profileData={mockTeacherProfile} currentUser={mockCurrentUser} />);

    expect(screen.getAllByText('Elena Rostova')[0]).toBeInTheDocument();
    expect(screen.getByText('@elena_ashtanga')).toBeInTheDocument();
    expect(screen.getByText('📍 W4, W12, W5...')).toBeInTheDocument();
    expect(screen.getByText('342')).toBeInTheDocument();
    expect(screen.getByText('SUBSCRIBERS')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
    expect(screen.getByText('POSTS')).toBeInTheDocument();
  });

  it('renders Brand profile with single Join button and studio branches tab', () => {
    render(<UnifiedProfileView profileData={mockBrandProfile} currentUser={mockCurrentUser} />);

    expect(screen.getAllByText('Affordable London Yoga')[0]).toBeInTheDocument();
    expect(screen.getByText('🏢 Brand Network (Top Level)')).toBeInTheDocument();
    expect(screen.getByText('1240')).toBeInTheDocument();
    expect(screen.getByText('MEMBERS')).toBeInTheDocument();

    // Switch to Studios tab
    fireEvent.click(screen.getByText('🏢 Studios'));
    expect(screen.getByText('Chiswick Hot Yoga Studio')).toBeInTheDocument();
  });

  it('enforces privacy guardrail when viewing a private user profile', () => {
    const privateUser: UnifiedProfileData = {
      ...mockTeacherProfile,
      id: 'user_private_999',
      isProfilePublic: false,
    };

    render(<UnifiedProfileView profileData={privateUser} currentUser={mockCurrentUser} />);

    expect(screen.getByText("This Yogi's Profile is Private")).toBeInTheDocument();
  });

  it('opens TeacherScheduleModal when clicking Schedule ➔ CTA button', () => {
    render(<UnifiedProfileView profileData={mockTeacherProfile} currentUser={mockCurrentUser} />);

    // Switch to Classes tab
    fireEvent.click(screen.getByText('🧘 Classes'));
    expect(screen.getByText('Sunset Hot Ashtanga Flow')).toBeInTheDocument();

    // Click Schedule button
    fireEvent.click(screen.getByText('Schedule ➔'));
    expect(screen.getByText('Elena Rostova — Schedule')).toBeInTheDocument();
  });

  it('renders unactionable status badge and ellipsis menu with Leave button when user has joined', async () => {
    const joinedUser: UserProfile = {
      ...mockCurrentUser,
      joinedCommunities: ['comm_brand_001'],
    };

    render(<UnifiedProfileView profileData={mockBrandProfile} currentUser={joinedUser} />);

    expect(screen.getByTestId('joined-status-badge')).toBeInTheDocument();
    expect(screen.getByText('✓ Joined Community')).toBeInTheDocument();

    // Menu should initially be closed
    expect(screen.queryByTestId('leave-community-btn')).not.toBeInTheDocument();

    // Click ellipsis menu trigger
    fireEvent.click(screen.getByTestId('profile-menu-trigger'));
    expect(screen.getByTestId('leave-community-btn')).toBeInTheDocument();

    // Click tapaway backdrop to close
    fireEvent.click(screen.getByTestId('profile-menu-backdrop'));
    expect(screen.queryByTestId('leave-community-btn')).not.toBeInTheDocument();
  });

  it('triggers the pass selector modal when clicking the booking button in TeacherScheduleModal', async () => {
    const mockPasses = [
      {
        id: 'pass_1',
        userId: 'user_123',
        currencyId: 'curr_1',
        currencyTitle: '5-Class Pack',
        tierType: 'pack',
        creditsRemaining: 5,
        status: 'active',
        expiresAt: '2026-12-31',
      },
    ];
    vi.mocked(firestoreService.fetchUserPasses).mockResolvedValue(mockPasses as any);
    vi.mocked(firestoreService.fetchStudioCurrencyPolicy).mockResolvedValue(null);

    render(<UnifiedProfileView profileData={mockTeacherProfile} currentUser={mockCurrentUser} />);

    // Switch to Classes tab
    fireEvent.click(screen.getByText('🧘 Classes'));

    // Open Schedule modal
    fireEvent.click(screen.getByText('Schedule ➔'));
    expect(screen.getByText('Elena Rostova — Schedule')).toBeInTheDocument();

    // Click Book button in modal
    const bookButton = screen.getByText('Book Class (1 Studio Credit) ➔');
    fireEvent.click(bookButton);

    // Assert BookingPassSelectionModalView (Redeem Pass & Book) is triggered
    expect(await screen.findByText('Redeem Pass & Book')).toBeInTheDocument();
    expect(screen.getByText('5-Class Pack')).toBeInTheDocument();
  });

  it('completes class booking with pass from TeacherScheduleModal and updates status to Booked', async () => {
    const mockPasses = [
      {
        id: 'pass_1',
        userId: 'user_123',
        currencyId: 'curr_1',
        currencyTitle: '5-Class Pack',
        tierType: 'pack',
        creditsRemaining: 5,
        status: 'active',
        expiresAt: '2026-12-31',
      },
    ];
    vi.mocked(firestoreService.fetchUserPasses).mockResolvedValue(mockPasses as any);
    vi.mocked(firestoreService.fetchStudioCurrencyPolicy).mockResolvedValue(null);
    vi.mocked(firestoreService.bookClassWithPass).mockResolvedValue({ bookingId: 'b_123', status: 'confirmed' });

    render(<UnifiedProfileView profileData={mockTeacherProfile} currentUser={mockCurrentUser} />);

    fireEvent.click(screen.getByText('🧘 Classes'));
    fireEvent.click(screen.getByText('Schedule ➔'));

    const bookButton = screen.getByText('Book Class (1 Studio Credit) ➔');
    fireEvent.click(bookButton);

    expect(await screen.findByText('Redeem Pass & Book')).toBeInTheDocument();

    const confirmBookButton = screen.getByTestId('confirm-booking-pass-button');
    fireEvent.click(confirmBookButton);

    await waitFor(() => {
      expect(firestoreService.bookClassWithPass).toHaveBeenCalledWith(
        'cls_1',
        'st_1',
        'user_123',
        'test_yogi',
        'pass_1'
      );
    });

    // Pass selector closes and modal shows ✓ Booked
    await waitFor(() => {
      expect(screen.queryByText('Redeem Pass & Book')).not.toBeInTheDocument();
      expect(screen.getByText('✓ Booked')).toBeInTheDocument();
    });
  });

  it('calls onBookClass prop when provided when tapping book in TeacherScheduleModal', async () => {
    const onBookClassMock = vi.fn();
    vi.mocked(firestoreService.fetchUserPasses).mockResolvedValue([]);
    vi.mocked(firestoreService.fetchStudioCurrencyPolicy).mockResolvedValue(null);

    render(
      <UnifiedProfileView
        profileData={mockTeacherProfile}
        currentUser={mockCurrentUser}
        onBookClass={onBookClassMock}
      />
    );

    fireEvent.click(screen.getByText('🧘 Classes'));
    fireEvent.click(screen.getByText('Schedule ➔'));

    const bookButton = screen.getByText('Book Class (1 Studio Credit) ➔');
    fireEvent.click(bookButton);

    expect(onBookClassMock).toHaveBeenCalledWith(mockTeacherProfile.classes![0]);
  });
});
