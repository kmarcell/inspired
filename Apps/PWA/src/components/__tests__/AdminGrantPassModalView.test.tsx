import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminGrantPassModalView } from '../AdminGrantPassModalView';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    grantUserPass: vi.fn(),
  },
}));

describe('AdminGrantPassModalView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders credit quantity stepper and executes grant', async () => {
    vi.mocked(firestoreService.grantUserPass).mockResolvedValue({
      id: 'pass_granted_123',
      userId: 'elena@inspiredyoga.app',
      currencyId: 'custom_credit_grant',
      currencyTitle: 'Custom 2-Credit Grant',
      tierType: 'credit_pack',
      totalCredits: 2,
      creditsRemaining: 2,
      validityDays: 60,
      purchasedAt: '2026-09-03T10:00:00Z',
      expiresAt: '2026-11-03T10:00:00Z',
      status: 'active',
    });

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <AdminGrantPassModalView
        studioId="studio_askew_001"
        studioName="Askew Road Zen Den"
        currencies={[]}
        adminUserId="admin_owner_001"
        onGrantSuccess={handleSuccess}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Grant Pass & Credits to Member')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/elena@inspiredyoga.app/i);
    fireEvent.change(input, { target: { value: 'elena@inspiredyoga.app' } });

    const grantBtn = screen.getByRole('button', { name: /Grant 2 Credit\(s\) & Deposit/i });
    fireEvent.click(grantBtn);

    await waitFor(() => {
      expect(firestoreService.grantUserPass).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'elena@inspiredyoga.app',
          totalCredits: 2,
          studioId: 'studio_askew_001',
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
