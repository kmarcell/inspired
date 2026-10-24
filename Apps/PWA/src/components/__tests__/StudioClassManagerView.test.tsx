import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudioClassManagerView } from '../StudioClassManagerView';
import { firestoreService } from '../../services/firestoreService';
import { YogaStudio } from '../../types';

vi.mock('../../services/firestoreService');

describe('StudioClassManagerView Component', () => {
  const mockStudio: YogaStudio = {
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

  const mockTemplates = [
    {
      id: 'tpl_001',
      companyId: 'comp_zen_01',
      className: 'Hot Ashtanga Primary Series',
      classTypeDescription: 'Traditional 90m primary series in 35°C heat.',
      durationMinutes: 90,
      capacity: 24,
      roomClimate: 'hot_studio' as const,
      temperatureCelsius: 35,
      skillLevel: 'All Levels',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
    },
  ];

  const mockDrafts = [
    {
      id: 'draft_001',
      studioId: 'studio_chiswick_01',
      className: 'Yin & Restorative Flow',
      classTypeDescription: 'Deep relaxing stretch.',
      teacherId: 'teacher_elena',
      teacherName: 'Elena Rostova',
      dayOfWeek: 1,
      dateString: '2026-09-07',
      startTime: '06:00 PM',
      endTime: '07:00 PM',
      capacity: 20,
      bookedCount: 0,
      waitlist: [],
      roomClimate: 'natural_ambient' as const,
      status: 'draft' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (firestoreService.fetchBrandClassTemplates as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockTemplates);
    (firestoreService.fetchStudioDrafts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockDrafts);
    (firestoreService.deleteBrandClassTemplate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (firestoreService.deleteStudioClassDraft as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (firestoreService.publishStudioClass as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('renders templates and drafts manager view with tabs', async () => {
    render(
      <StudioClassManagerView
        studio={mockStudio}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('📅 Class Templates & Drafts Manager')).toBeInTheDocument();
      expect(screen.getByText('Hot Ashtanga Primary Series')).toBeInTheDocument();
    });

    // Switch to Saved Studio Drafts tab
    fireEvent.click(screen.getByText('📝 Saved Studio Drafts'));

    await waitFor(() => {
      expect(screen.getByText('Yin & Restorative Flow')).toBeInTheDocument();
    });
  });

  it('opens template scheduler modal on Use Template click', async () => {
    render(
      <StudioClassManagerView
        studio={mockStudio}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('📅 Use Template to Schedule ➔')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('📅 Use Template to Schedule ➔'));

    await waitFor(() => {
      expect(screen.getByText('Schedule: Hot Ashtanga Primary Series')).toBeInTheDocument();
    });
  });

  it('publishes a draft live directly from manager view', async () => {
    render(
      <StudioClassManagerView
        studio={mockStudio}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('📝 Saved Studio Drafts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('📝 Saved Studio Drafts'));

    await waitFor(() => {
      expect(screen.getByText('🚀 Publish Live')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('🚀 Publish Live'));

    await waitFor(() => {
      expect(firestoreService.publishStudioClass).toHaveBeenCalledWith(
        expect.objectContaining({
          studioId: 'studio_chiswick_01',
          className: 'Yin & Restorative Flow',
        })
      );
    });
  });
});
