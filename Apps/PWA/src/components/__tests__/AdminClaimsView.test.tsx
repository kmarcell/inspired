import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminClaimsView } from '../AdminClaimsView';
import { useAuth } from '../../context/AuthContext';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../context/AuthContext');
vi.mock('../../services/firestoreService');

describe('AdminClaimsView Component', () => {
  const mockAdminUser = {
    id: 'user_admin_001',
    username: 'admin_inspired#0001',
    displayName: 'Inspired Verification Admin',
    isAdmin: true,
  };

  const mockPendingClaims = [
    {
      id: 'claim_123',
      studioId: 'studio_askew_001',
      studioName: 'Askew Road Zen Den',
      userId: 'user_teacher_001',
      userEmail: 'user_teacher_001@inspired.test',
      verificationMethod: 'document',
      documentFileName: 'utility_bill.pdf',
      status: 'pending',
      createdAt: '2026-08-28T15:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockAdminUser,
    });
    (firestoreService.fetchPendingClaims as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPendingClaims);
  });

  it('renders admin claims portal and pending claim queue items', async () => {
    render(<AdminClaimsView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Studio Claim Verification Portal')).toBeInTheDocument();
      expect(screen.getByText('Askew Road Zen Den')).toBeInTheDocument();
      expect(screen.getByText('user_teacher_001@inspired.test')).toBeInTheDocument();
    });
  });

  it('approves studio claim when approve button is clicked', async () => {
    (firestoreService.approveStudioClaim as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<AdminClaimsView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('approve-claim-claim_123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('approve-claim-claim_123'));

    await waitFor(() => {
      expect(firestoreService.approveStudioClaim).toHaveBeenCalledWith(
        'claim_123',
        'studio_askew_001',
        'user_teacher_001'
      );
      expect(screen.getByTestId('admin-action-success')).toBeInTheDocument();
    });
  });

  it('rejects studio claim with optional rejection reason', async () => {
    (firestoreService.rejectStudioClaim as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<AdminClaimsView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('reject-claim-claim_123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('reject-claim-claim_123'));

    await waitFor(() => {
      expect(screen.getByTestId('input-rejection-reason')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-rejection-reason'), {
      target: { value: 'Document address does not match studio location.' },
    });

    fireEvent.click(screen.getByTestId('submit-rejection-button'));

    await waitFor(() => {
      expect(firestoreService.rejectStudioClaim).toHaveBeenCalledWith(
        'claim_123',
        'Document address does not match studio location.'
      );
    });
  });

  it('allows issuing staging invitation in Invited Members tab', async () => {
    (firestoreService.fetchStagingInvites as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'inv_1', email: 'preview_tester@inspired.test', invitedBy: 'user_admin_001', createdAt: '2026-08-29T10:00:00Z' },
    ]);
    (firestoreService.createStagingInvite as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<AdminClaimsView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-staging-invites')).toBeInTheDocument();
      expect(screen.getByText(/Invited Members/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('admin-tab-staging-invites'));

    await waitFor(() => {
      expect(screen.getByTestId('input-invite-email')).toBeInTheDocument();
      expect(screen.getByText('preview_tester@inspired.test')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('input-invite-email'), {
      target: { value: 'new_tester@inspired.test' },
    });

    fireEvent.click(screen.getByTestId('submit-invite-button'));

    await waitFor(() => {
      expect(firestoreService.createStagingInvite).toHaveBeenCalledWith(
        'new_tester@inspired.test',
        'user_admin_001'
      );
    });
  });

  it('filters studios by status (All, Pending, Verified) on All Studio Locations tab', async () => {
    const mockStudios = [
      { id: 'st_1', name: 'Verified Zen Studio', address: '123 Main St', isClaimed: true, location_prefix: 'askew' },
      { id: 'st_2', name: 'Unverified Flow Studio', address: '456 High St', isClaimed: false, location_prefix: 'askew' },
    ];
    (firestoreService.fetchAllStudios as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockStudios);

    render(<AdminClaimsView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-all-studios')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('admin-tab-all-studios'));

    await waitFor(() => {
      expect(screen.getByText('Verified Zen Studio')).toBeInTheDocument();
      expect(screen.getByText('Unverified Flow Studio')).toBeInTheDocument();
    });

    // Click Pending filter
    fireEvent.click(screen.getByTestId('filter-studio-pending'));
    expect(screen.queryByText('Verified Zen Studio')).not.toBeInTheDocument();
    expect(screen.getByText('Unverified Flow Studio')).toBeInTheDocument();

    // Click Verified filter
    fireEvent.click(screen.getByTestId('filter-studio-verified'));
    expect(screen.getByText('Verified Zen Studio')).toBeInTheDocument();
    expect(screen.queryByText('Unverified Flow Studio')).not.toBeInTheDocument();
  });
});
