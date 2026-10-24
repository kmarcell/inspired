import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateClassFromTemplateModal } from '../CreateClassFromTemplateModal';
import { firestoreService } from '../../services/firestoreService';
import { YogaStudio, BrandClassTemplate } from '../../types';

vi.mock('../../services/firestoreService');

describe('CreateClassFromTemplateModal Component', () => {
  const mockTemplate: BrandClassTemplate = {
    id: 'tpl_ashtanga_01',
    companyId: 'comp_zen_01',
    className: 'Hot Ashtanga Primary Blueprint',
    styleName: 'Ashtanga',
    classTypeDescription: 'Standard 90-minute full primary sequence in 38°C infrared heat.',
    description: 'Comprehensive guided primary series blueprint.',
    durationMinutes: 90,
    capacity: 22,
    roomClimate: 'hot_studio',
    temperatureCelsius: 38,
    skillLevel: 'Intermediate to Advanced',
    equipmentNeeded: 'Mat & Towel',
    currencyAcceptancePolicyMode: 'acceptAll',
    acceptedCurrencyIds: [],
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  };

  const mockStudioA: YogaStudio = {
    id: 'studio_chiswick_01',
    name: 'Chiswick Hot Yoga',
    address: '14 Chiswick High Rd, London W4 1ZQ',
    location_prefix: 'W4',
    rating: 5.0,
    reviewCount: 42,
    isClaimed: true,
    ownerId: 'usr_owner_123',
    companyId: 'comp_zen_01',
    parentBrandName: 'Affordable London Yoga',
    engagementScore: 500,
    moderationSettings: { autoApproveMemberComments: true, guestCommentsEnabled: false },
    location: { lat: 51.49, lng: -0.26 },
    assignedTeachers: [
      { id: 'teacher_elena', displayName: 'Elena Rostova', specialty: 'Hot Ashtanga' },
    ],
  };

  const mockStudioB: YogaStudio = {
    id: 'studio_askew_001',
    name: 'Askew Road Zen Den',
    address: '88 Askew Rd, London W12 9BJ',
    location_prefix: 'W12',
    rating: 4.8,
    reviewCount: 30,
    isClaimed: true,
    ownerId: 'usr_owner_123',
    companyId: 'comp_zen_01',
    parentBrandName: 'Affordable London Yoga',
    engagementScore: 400,
    moderationSettings: { autoApproveMemberComments: true, guestCommentsEnabled: false },
    location: { lat: 51.50, lng: -0.24 },
    assignedTeachers: [
      { id: 'teacher_maryia', displayName: 'Maryia Vane', specialty: 'Vinyasa Flow' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (firestoreService.publishStudioClass as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'cls_inst_01',
        studioId: 'studio_chiswick_01',
        className: 'Hot Ashtanga Primary Blueprint',
        status: 'published',
      },
    ]);
  });

  it('renders template blueprint details', () => {
    render(
      <CreateClassFromTemplateModal
        template={mockTemplate}
        activeStudio={mockStudioA}
        availableStudios={[mockStudioA, mockStudioB]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('📋 Brand Template Blueprint')).toBeInTheDocument();
    expect(screen.getByText(/Schedule:/i)).toBeInTheDocument();
    expect(screen.getByText(/Hot Ashtanga Primary Blueprint/)).toBeInTheDocument();
    expect(screen.getByText(/22 Capacity/)).toBeInTheDocument();
  });

  it('synchronizes teachers when target studio branch changes', () => {
    render(
      <CreateClassFromTemplateModal
        template={mockTemplate}
        activeStudio={mockStudioA}
        availableStudios={[mockStudioA, mockStudioB]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Initial studio A has Elena
    expect(screen.getByText(/Elena Rostova/)).toBeInTheDocument();

    // Switch to studio B
    const studioSelect = screen.getByDisplayValue(/Chiswick Hot Yoga/);
    fireEvent.change(studioSelect, { target: { value: 'studio_askew_001' } });

    // Now studio B's teacher Maryia should be displayed
    expect(screen.getByText(/Maryia Vane/)).toBeInTheDocument();
  });

  it('handles studio with empty assignedTeachers gracefully with dynamic staff fallback', () => {
    const studioWithoutTeachers: YogaStudio = {
      ...mockStudioA,
      id: 'studio_empty_01',
      name: 'Independent Shala',
      assignedTeachers: [],
    };

    render(
      <CreateClassFromTemplateModal
        template={mockTemplate}
        activeStudio={studioWithoutTeachers}
        availableStudios={[studioWithoutTeachers]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Independent Shala Staff/)).toBeInTheDocument();
  });

  it('publishes recurring class instances on submit', async () => {
    const handleSuccess = vi.fn();
    render(
      <CreateClassFromTemplateModal
        template={mockTemplate}
        activeStudio={mockStudioA}
        availableStudios={[mockStudioA]}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    const publishBtn = screen.getByRole('button', { name: /🚀 Instantiate & Publish Live/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(firestoreService.publishStudioClass).toHaveBeenCalledTimes(1);
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
