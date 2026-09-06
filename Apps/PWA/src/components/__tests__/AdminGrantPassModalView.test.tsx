import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminGrantPassModalView } from '../AdminGrantPassModalView';
import { firestoreService } from '../../services/firestoreService';

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    grantUserPass: vi.fn(),
    fetchUserProfile: vi.fn(),
  },
}));

describe('AdminGrantPassModalView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders credit quantity stepper and executes grant', async () => {
    vi.mocked(firestoreService.fetchUserProfile).mockResolvedValue({
      id: 'elena@inspiredyoga.app',
      username: 'elena_rostova',
      joinedCommunities: [],
      privacySettings: { isProfilePublic: true, avatarPrivacy: 'public', showJoinedGroups: 'members-only' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    vi.mocked(firestoreService.grantUserPass).mockResolvedValue({
      id: 'pass_granted_123',
      userId: 'elena@inspiredyoga.app',
      currencyId: 'custom_credit_grant',
      currencyTitle: 'Custom 1-Credit Grant',
      tierType: 'credit_pack',
      totalCredits: 1,
      creditsRemaining: 1,
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

    const grantBtn = screen.getByRole('button', { name: /Grant 1 Credit\(s\) & Deposit/i });
    fireEvent.click(grantBtn);

    await waitFor(() => {
      expect(firestoreService.grantUserPass).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'elena@inspiredyoga.app',
          totalCredits: 1,
          studioId: 'studio_askew_001',
        })
      );
      expect(screen.getByText('Pass Granted & Deposited!')).toBeInTheDocument();
    });

    const doneBtn = screen.getByRole('button', { name: /Done/i });
    fireEvent.click(doneBtn);
    expect(handleSuccess).toHaveBeenCalled();
  });
});
