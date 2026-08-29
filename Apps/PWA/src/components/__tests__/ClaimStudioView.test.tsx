import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClaimStudioView } from '../ClaimStudioView';
import { useAuth } from '../../context/AuthContext';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../context/AuthContext');
vi.mock('../../services/firestoreService');

describe('ClaimStudioView Component', () => {
  const mockUser = {
    id: 'user_123',
    username: 'yogi_sarah',
    displayName: 'Sarah Jenkins',
  };

  const mockShadowStudio = {
    id: 'studio_askew_001',
    name: 'Askew Road Zen Den',
    address: '123 Askew Rd, London W12 9AU',
    location_prefix: 'W12',
    isClaimed: false,
    ownerId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
    });
    (firestoreService.fetchStudioById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockShadowStudio);
  });

  it('renders unclaimed shadow profile studio claim form', async () => {
    render(<ClaimStudioView studioId="studio_askew_001" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Claim Askew Road Zen Den')).toBeInTheDocument();
      expect(screen.getByText('Unclaimed Shadow Profile')).toBeInTheDocument();
      expect(screen.getByTestId('input-claim-document')).toBeInTheDocument();
    });
  });

  it('submits claim verification request successfully', async () => {
    const handleSuccess = vi.fn();
    (firestoreService.submitStudioClaim as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'pending',
      claimId: 'claim_98765',
    });

    render(<ClaimStudioView studioId="studio_askew_001" onClose={vi.fn()} onSuccess={handleSuccess} />);

    await waitFor(() => {
      expect(screen.getByTestId('submit-claim-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('submit-claim-button'));

    await waitFor(() => {
      expect(firestoreService.submitStudioClaim).toHaveBeenCalledWith(
        'user_123',
        'yogi_sarah',
        'studio_askew_001',
        'Askew Road Zen Den',
        undefined
      );
      expect(screen.getByTestId('claim-submitted-banner')).toBeInTheDocument();
    });
  });

  it('handles back button navigation', async () => {
    const handleClose = vi.fn();
    render(<ClaimStudioView studioId="studio_askew_001" onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('claim-studio-back-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('claim-studio-back-button'));
    expect(handleClose).toHaveBeenCalled();
  });
});
