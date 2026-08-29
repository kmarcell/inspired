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
});
