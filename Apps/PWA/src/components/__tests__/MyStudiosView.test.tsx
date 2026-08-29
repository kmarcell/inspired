import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyStudiosView } from '../MyStudiosView';
import { useAuth } from '../../context/AuthContext';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../context/AuthContext');
vi.mock('../../services/firestoreService');

describe('MyStudiosView Component', () => {
  const mockUser = {
    id: 'usr_owner_123',
    username: 'studio_owner',
    joinedCommunities: ['area_askew'],
    privacySettings: { isProfilePublic: true, avatarPrivacy: 'public', showJoinedGroups: 'members-only' },
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z',
  };

  const mockCompanies = [
    {
      id: 'comp_zen_01',
      name: 'Zen Sanctuary Group',
      ownerId: 'usr_owner_123',
      contactEmail: 'contact@zensanctuary.co.uk',
      description: 'Boutique hot yoga sanctuaries',
      createdAt: '2026-08-28T10:00:00Z',
    },
  ];

  const mockStudios = [
    {
      id: 'studio_askew_01',
      name: 'Askew Road Zen Den',
      address: '123 Askew Rd, London W12 9AU',
      location_prefix: 'W12',
      isClaimed: true,
      ownerId: 'usr_owner_123',
      companyId: 'comp_zen_01',
      rating: 4.9,
      reviewCount: 42,
      engagementScore: 50,
      moderationSettings: { autoApproveMemberComments: true, guestCommentsEnabled: false },
      location: { lat: 51.5, lng: -0.2 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
    });
    (firestoreService.fetchCompaniesByOwner as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    (firestoreService.fetchStudiosByOwner as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockStudios);
  });

  it('renders owned companies and studio branch locations', async () => {
    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('My Brands & Studios')).toBeInTheDocument();
      expect(screen.getByText('Zen Sanctuary Group')).toBeInTheDocument();
      expect(screen.getByText(/Askew Road Zen Den/)).toBeInTheDocument();
    });
  });

  it('opens CreateStudioView form when add button is clicked', async () => {
    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('add-studio-header-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-studio-header-button'));

    await waitFor(() => {
      expect(screen.getByText('Create Studio & Brand')).toBeInTheDocument();
    });
  });

  it('displays empty state banner when user has no owned studios or companies', async () => {
    (firestoreService.fetchCompaniesByOwner as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (firestoreService.fetchStudiosByOwner as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Manage Your Yoga Studio & Brands')).toBeInTheDocument();
      expect(screen.getByTestId('create-studio-empty-button')).toBeInTheDocument();
    });
  });

  it('allows bio editing inside Manage Studio modal for verified studios', async () => {
    (firestoreService.updateStudioBio as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('input-edit-studio-bio')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-edit-studio-bio'), {
      target: { value: 'Updated Zen Den sanctuary bio text.' },
    });

    fireEvent.click(screen.getByTestId('submit-save-bio-button'));

    await waitFor(() => {
      expect(firestoreService.updateStudioBio).toHaveBeenCalledWith(
        'studio_askew_01',
        'Updated Zen Den sanctuary bio text.'
      );
    });
  });

  it('allows studio soft closure via Manage Studio modal confirmation', async () => {
    (firestoreService.deleteStudio as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('status-closed-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('status-closed-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-studio-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('confirm-delete-studio-button'));

    await waitFor(() => {
      expect(firestoreService.deleteStudio).toHaveBeenCalledWith('studio_askew_01');
    });
  });

  it('allows reopening a closed studio inside Manage Studio modal', async () => {
    const closedStudioList = [
      {
        id: 'studio_closed_01',
        name: 'Past Sanctuary',
        address: '456 High St',
        location_prefix: 'W6',
        isClaimed: true,
        isClosed: true,
        status: 'closed' as const,
        ownerId: 'usr_owner_123',
        companyId: 'comp_zen_01',
        rating: 4.5,
        reviewCount: 10,
        engagementScore: 10,
        moderationSettings: { autoApproveMemberComments: true, guestCommentsEnabled: false },
        location: { lat: 51.5, lng: -0.2 },
      },
    ];
    (firestoreService.fetchStudiosByOwner as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(closedStudioList);
    (firestoreService.updateStudioStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-btn-studio_closed_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-btn-studio_closed_01'));

    await waitFor(() => {
      expect(screen.getByTestId('status-active-btn-studio_closed_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('status-active-btn-studio_closed_01'));

    await waitFor(() => {
      expect(firestoreService.updateStudioStatus).toHaveBeenCalledWith('studio_closed_01', 'active');
    });
  });

  it('allows setting temporary closure status with closure note', async () => {
    (firestoreService.updateStudioStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('status-temp-closed-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('status-temp-closed-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('input-status-note')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-status-note'), {
      target: { value: 'Closed for summer renovation until Sept 15' },
    });

    fireEvent.blur(screen.getByTestId('input-status-note'));

    await waitFor(() => {
      expect(firestoreService.updateStudioStatus).toHaveBeenCalledWith(
        'studio_askew_01',
        'temp_closed',
        'Closed for summer renovation until Sept 15'
      );
    });
  });

  it('allows managing and editing company brand details', async () => {
    (firestoreService.updateCompany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-company-btn-comp_zen_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-company-btn-comp_zen_01'));

    await waitFor(() => {
      expect(screen.getByTestId('input-edit-company-name')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-edit-company-name'), {
      target: { value: 'Zen Sanctuary Group UK' },
    });

    fireEvent.click(screen.getByTestId('submit-save-company-button'));

    await waitFor(() => {
      expect(firestoreService.updateCompany).toHaveBeenCalledWith('comp_zen_01', {
        name: 'Zen Sanctuary Group UK',
        contactEmail: 'contact@zensanctuary.co.uk',
        website: '',
        description: 'Boutique hot yoga sanctuaries',
      });
    });
  });

  it('allows hard deleting a studio via in-app confirmation modal', async () => {
    (firestoreService.hardDeleteStudio as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('hard-delete-studio-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('hard-delete-studio-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-hard-delete-studio-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('confirm-hard-delete-studio-button'));

    await waitFor(() => {
      expect(firestoreService.hardDeleteStudio).toHaveBeenCalledWith('studio_askew_01');
    });
  });

  it('allows reassigning studio parent brand inside Manage Studio drawer', async () => {
    (firestoreService.updateStudioCompany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-btn-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-btn-studio_askew_01'));

    await waitFor(() => {
      expect(screen.getByTestId('select-studio-company-studio_askew_01')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('select-studio-company-studio_askew_01'), {
      target: { value: 'none' },
    });

    await waitFor(() => {
      expect(firestoreService.updateStudioCompany).toHaveBeenCalledWith('studio_askew_01', null);
    });
  });
});
