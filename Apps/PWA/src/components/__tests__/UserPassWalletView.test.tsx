import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserPassWalletView } from '../UserPassWalletView';
import { firestoreService } from '../../services/firestoreService';
import { UserPass } from '../../types';

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    fetchUserPasses: vi.fn(),
  },
}));

describe('UserPassWalletView Component', () => {
  const mockUserPasses: UserPass[] = [
    {
      id: 'pass_001',
      userId: 'user_123',
      currencyId: 'curr_5pack',
      currencyTitle: '5-Class Pack (Summer)',
      tierType: 'credit_pack',
      totalCredits: 5,
      creditsRemaining: 3,
      validityDays: 60,
      purchasedAt: '2026-06-01T10:00:00Z',
      expiresAt: '2026-08-01T10:00:00Z',
      status: 'active',
    },
    {
      id: 'pass_002',
      userId: 'user_123',
      currencyId: 'curr_unlimited',
      currencyTitle: 'Monthly Unlimited Zen Pass',
      tierType: 'unlimited',
      unlimitedPeriod: 'monthly',
      validityDays: 30,
      purchasedAt: '2026-05-01T10:00:00Z',
      expiresAt: '2026-05-31T10:00:00Z',
      status: 'expired',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wallet title and active pass details', async () => {
    vi.mocked(firestoreService.fetchUserPasses).mockResolvedValue(mockUserPasses);

    render(<UserPassWalletView userId="user_123" />);

    await waitFor(() => {
      expect(screen.getByText('My Digital Pass Wallet')).toBeInTheDocument();
      expect(screen.getByText('5-Class Pack (Summer)')).toBeInTheDocument();
      expect(screen.getByText('3 / 5 Credits Remaining')).toBeInTheDocument();
    });
  });

  it('renders empty fallback state when user holds no passes', async () => {
    vi.mocked(firestoreService.fetchUserPasses).mockResolvedValue([]);

    render(<UserPassWalletView userId="user_123" />);

    await waitFor(() => {
      expect(screen.getByText('No Active Passes Found')).toBeInTheDocument();
    });
  });
});
