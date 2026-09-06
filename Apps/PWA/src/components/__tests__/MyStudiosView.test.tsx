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
    {
      id: 'studio_chiswick_02',
      name: 'Chiswick Independent Flow',
      address: '88 High Rd, London W4 1SY',
      location_prefix: 'W4',
      isClaimed: true,
      ownerId: 'usr_owner_123',
      rating: 4.8,
      reviewCount: 20,
      engagementScore: 40,
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
    (firestoreService.fetchCompanyCurrencies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (firestoreService.fetchStudioCurrencyPolicy as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it('renders owned companies and independent studios', async () => {
    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('My Brands & Studios')).toBeInTheDocument();
      expect(screen.getByText('Zen Sanctuary Group')).toBeInTheDocument();
      expect(screen.getByText('Chiswick Independent Flow')).toBeInTheDocument();
    });
  });

  it('opens CreateStudioView form when add studio button is clicked', async () => {
    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('create-studio-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-studio-button'));

    await waitFor(() => {
      expect(screen.getByText('Create Studio & Brand')).toBeInTheDocument();
    });
  });

  it('pushes to Brand Subpage when Manage Brand is clicked', async () => {
    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-company-comp_zen_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-company-comp_zen_01'));

    await waitFor(() => {
      expect(screen.getByTestId('brand-back-button')).toBeInTheDocument();
      expect(screen.getByTestId('brand-tab-studios')).toBeInTheDocument();
      expect(screen.getByTestId('brand-tab-currencies')).toBeInTheDocument();
      expect(screen.getByTestId('brand-tab-settings')).toBeInTheDocument();
    });
  });

  it('pushes to Studio Subpage when Manage Studio is clicked', async () => {
    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-studio_chiswick_02')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-studio_chiswick_02'));

    await waitFor(() => {
      expect(screen.getByTestId('studio-back-button')).toBeInTheDocument();
      expect(screen.getByTestId('studio-tab-general')).toBeInTheDocument();
      expect(screen.getByTestId('studio-tab-pricing')).toBeInTheDocument();
    });
  });

  it('allows editing bio inside Studio Subpage General Settings tab', async () => {
    (firestoreService.updateStudioBio as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-studio_chiswick_02')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-studio_chiswick_02'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Heated flows/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Heated flows/i), {
      target: { value: 'Updated Zen Den sanctuary bio text.' },
    });

    fireEvent.click(screen.getByText('Save Studio Bio'));

    await waitFor(() => {
      expect(firestoreService.updateStudioBio).toHaveBeenCalledWith(
        'studio_chiswick_02',
        'Updated Zen Den sanctuary bio text.'
      );
    });
  });

  it('allows managing brand profile details inside Brand Settings tab', async () => {
    (firestoreService.updateCompany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-company-comp_zen_01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-company-comp_zen_01'));

    await waitFor(() => {
      expect(screen.getByTestId('brand-tab-settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('brand-tab-settings'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Affordable London Yoga')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Affordable London Yoga'), {
      target: { value: 'Zen Sanctuary Group UK' },
    });

    fireEvent.click(screen.getByText('Save Brand Info'));

    await waitFor(() => {
      expect(firestoreService.updateCompany).toHaveBeenCalledWith('comp_zen_01', {
        name: 'Zen Sanctuary Group UK',
        contactEmail: 'contact@zensanctuary.co.uk',
        website: '',
        description: 'Boutique hot yoga sanctuaries',
      });
    });
  });

  it('allows creating custom location currencies inside Studio Subpage Pricing tab for an independent studio', async () => {
    (firestoreService.fetchStudioCurrencies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (firestoreService.createCompanyCurrency as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'curr_chiswick_01',
      studioId: 'studio_chiswick_02',
      title: '10-Class Independent Pack',
      description: 'Valid for 10 classes',
      tierType: 'credit_pack',
      creditCount: 10,
      basePriceAmount: 120,
      currencySymbol: '£',
      validityDays: 60,
      allowedStudioIds: ['studio_chiswick_02'],
      createdAt: '2026-09-04T10:00:00Z',
      updatedAt: '2026-09-04T10:00:00Z',
    });

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-studio_chiswick_02')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-studio_chiswick_02'));

    await waitFor(() => {
      expect(screen.getByTestId('studio-tab-pricing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('studio-tab-pricing'));

    await waitFor(() => {
      expect(screen.getByText('Create Currency')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Currency'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Pass Title/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Pass Title/i), {
      target: { value: '10-Class Independent Pack' },
    });

    fireEvent.click(screen.getByText('✓ Save Currency Changes'));

    await waitFor(() => {
      expect(firestoreService.createCompanyCurrency).toHaveBeenCalledWith(
        expect.objectContaining({
          studioId: 'studio_chiswick_02',
          title: '10-Class Independent Pack',
          allowedStudioIds: ['studio_chiswick_02'],
        })
      );
    });
  });

  it('allows editing an existing currency package when Edit button is clicked', async () => {
    const mockCurrency = {
      id: 'curr_chiswick_dropin',
      studioId: 'studio_chiswick_02',
      title: 'Single Drop-In',
      description: '1 Hot Yoga Class',
      tierType: 'drop_in' as const,
      creditCount: 1,
      basePriceAmount: 18,
      currencySymbol: '£',
      validityDays: 14,
      allowedStudioIds: ['studio_chiswick_02'],
      createdAt: '2026-09-04T10:00:00Z',
      updatedAt: '2026-09-04T10:00:00Z',
    };

    (firestoreService.fetchStudioCurrencies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockCurrency]);
    (firestoreService.updateCompanyCurrency as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<MyStudiosView onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-studio-studio_chiswick_02')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-studio-studio_chiswick_02'));

    await waitFor(() => {
      expect(screen.getByTestId('studio-tab-pricing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('studio-tab-pricing'));

    await waitFor(() => {
      expect(screen.getByTestId('edit-currency-curr_chiswick_dropin')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-currency-curr_chiswick_dropin'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Pass Title')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Pass Title'), {
      target: { value: 'Updated Peak Drop-In' },
    });

    fireEvent.click(screen.getByText('✓ Save Currency Changes'));

    await waitFor(() => {
      expect(firestoreService.updateCompanyCurrency).toHaveBeenCalledWith(
        'curr_chiswick_dropin',
        expect.objectContaining({
          title: 'Updated Peak Drop-In',
        })
      );
    });
  });
});
