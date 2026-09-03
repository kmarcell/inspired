import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NoPassAvailableModalView } from '../NoPassAvailableModalView';

describe('NoPassAvailableModalView Component', () => {
  it('renders insufficient credits alert and Purchase Pass button', () => {
    const handlePurchase = vi.fn();
    const handleClose = vi.fn();

    render(
      <NoPassAvailableModalView
        studioName="Askew Road Zen Den"
        classNameTitle="Yin Yoga"
        onPurchasePassClick={handlePurchase}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('No Valid Pass Available')).toBeInTheDocument();
    expect(screen.getByText('Insufficient Credits')).toBeInTheDocument();

    const purchaseBtn = screen.getByRole('button', { name: /Purchase Pass ➔/i });
    expect(purchaseBtn).toBeInTheDocument();

    fireEvent.click(purchaseBtn);
    expect(handlePurchase).toHaveBeenCalled();
  });
});
