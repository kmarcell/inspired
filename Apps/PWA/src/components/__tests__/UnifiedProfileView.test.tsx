import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UnifiedProfileView, UnifiedProfileData } from '../UnifiedProfileView';
import { UserProfile } from '../../types';

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
      teacherId: 'user_teacher_001',
      teacherName: 'Elena Rostova',
      title: 'Sunset Hot Ashtanga Flow',
      dateString: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:15',
      roomClimate: 'hot_studio',
      maxCapacity: 20,
      bookedCount: 5,
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
});
