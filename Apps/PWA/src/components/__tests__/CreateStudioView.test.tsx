import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateStudioView } from '../CreateStudioView';
import { useAuth } from '../../context/AuthContext';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../context/AuthContext');
vi.mock('../../services/firestoreService');

describe('CreateStudioView Component', () => {
  const mockUser = {
    id: 'usr_owner_123',
    username: 'studio_owner',
    joinedCommunities: ['area_askew'],
    privacySettings: { isProfilePublic: true, avatarPrivacy: 'public', showJoinedGroups: 'members-only' },
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
    });
    (firestoreService.fetchCompaniesByOwner as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'comp_zen_01',
        name: 'Zen Sanctuary Group',
        ownerId: 'usr_owner_123',
        contactEmail: 'contact@zensanctuary.co.uk',
        description: 'Boutique hot yoga sanctuaries',
        createdAt: '2026-08-28T10:00:00Z',
      },
    ]);
    (firestoreService.createCompany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'comp_new_02',
      name: 'Flow Hot Yoga',
      ownerId: 'usr_owner_123',
      contactEmail: 'flow@yoga.com',
      description: 'Hot flow studio',
      createdAt: '2026-08-28T10:00:00Z',
    });
    (firestoreService.createStudio as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'studio_chelsea_01',
      name: 'Chelsea Hot Flow',
      address: '78 King Rd, London SW3 4NX',
      location_prefix: 'SW3',
      isClaimed: true,
      ownerId: 'usr_owner_123',
      companyId: 'comp_zen_01',
      rating: 5.0,
      reviewCount: 0,
      engagementScore: 20,
      moderationSettings: { autoApproveMemberComments: true, guestCommentsEnabled: false },
      location: { lat: 51.5, lng: -0.1 },
    });
  });

  it('renders creation form and handles company selection', async () => {
    const handleClose = vi.fn();
    render(<CreateStudioView onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByText('Create Studio & Brand')).toBeInTheDocument();
    });

    expect(screen.getByTestId('select-company-id')).toBeInTheDocument();
    expect(screen.getByTestId('input-studio-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-studio-prefix')).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    const handleClose = vi.fn();
    render(<CreateStudioView onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('submit-create-studio-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('submit-create-studio-button'));

    await waitFor(() => {
      expect(screen.getByTestId('create-studio-error')).toHaveTextContent('Please enter a studio name.');
    });
  });

  it('submits new studio with existing company brand successfully', async () => {
    const handleSuccess = vi.fn();
    render(<CreateStudioView onClose={vi.fn()} onSuccess={handleSuccess} />);

    await waitFor(() => {
      expect(screen.getByTestId('select-company-id')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-studio-name'), { target: { value: 'Chelsea Hot Flow' } });
    fireEvent.change(screen.getByTestId('input-studio-prefix'), { target: { value: 'SW3' } });
    fireEvent.change(screen.getByTestId('input-studio-address'), { target: { value: '78 King Rd, London SW3 4NX' } });

    fireEvent.click(screen.getByTestId('submit-create-studio-button'));

    await waitFor(() => {
      expect(firestoreService.createStudio).toHaveBeenCalledWith(
        'usr_owner_123',
        expect.objectContaining({
          name: 'Chelsea Hot Flow',
          location_prefix: 'SW3',
          address: '78 King Rd, London SW3 4NX',
          companyId: 'comp_zen_01',
        })
      );
      expect(screen.getByTestId('create-studio-success')).toBeInTheDocument();
    });
  });
});
