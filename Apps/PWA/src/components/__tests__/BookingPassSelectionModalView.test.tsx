import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookingPassSelectionModalView } from '../BookingPassSelectionModalView';
import { UserPass } from '../../types';

describe('BookingPassSelectionModalView Component', () => {
  const mockPasses: UserPass[] = [
    {
      id: 'pass_001',
      userId: 'user_123',
      currencyId: 'curr_5pack',
      currencyTitle: '5-Class Pack (Summer)',
      tierType: 'credit_pack',
      totalCredits: 5,
      creditsRemaining: 4,
      validityDays: 60,
      purchasedAt: '2026-06-01T10:00:00Z',
      expiresAt: '2026-08-01T10:00:00Z',
      status: 'active',
    },
  ];

  it('renders booking details and concise Book button', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <BookingPassSelectionModalView
        classNameTitle="Hot Vinyasa Flow"
        studioName="Askew Road Zen Den"
        classDateString="2026-09-10"
        startTime="10:00 AM"
        userPasses={mockPasses}
        onConfirmBook={handleConfirm}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Redeem Pass & Book')).toBeInTheDocument();
    expect(screen.getByText('Hot Vinyasa Flow')).toBeInTheDocument();
    expect(screen.getByText('5-Class Pack (Summer)')).toBeInTheDocument();

    const bookBtn = screen.getByRole('button', { name: 'Book' });
    expect(bookBtn).toBeInTheDocument();
    expect(bookBtn).not.toBeDisabled();

    fireEvent.click(bookBtn);
    expect(handleConfirm).toHaveBeenCalledWith('pass_001');
  });

  it('disables Book button and displays warning when wallet passes do not match accepted currencies', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <BookingPassSelectionModalView
        classNameTitle="Premium Mysore Ashtanga"
        studioName="Askew Road Zen Den"
        classDateString="2026-09-10"
        startTime="06:30 AM"
        currencyAcceptancePolicyMode="customSelected"
        acceptedCurrencyIds={['curr_premium_only']}
        userPasses={mockPasses}
        onConfirmBook={handleConfirm}
        onClose={handleClose}
      />
    );

    expect(screen.getByText(/None of your active passes are accepted for this class/i)).toBeInTheDocument();
    expect(screen.getByText(/Ineligible for this class/i)).toBeInTheDocument();

    const bookBtn = screen.getByRole('button', { name: 'Book' });
    expect(bookBtn).toBeDisabled();

    fireEvent.click(bookBtn);
    expect(handleConfirm).not.toHaveBeenCalled();
  });
});
