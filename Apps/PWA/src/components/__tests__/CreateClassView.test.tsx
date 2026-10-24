import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateClassView } from '../CreateClassView';
import { firestoreService } from '../../services/firestoreService';
import { YogaStudio } from '../../types';

vi.mock('../../services/firestoreService');

describe('CreateClassView Component', () => {
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
      { id: 'teacher_maryia', displayName: 'Maryia Vane', specialty: 'Vinyasa Flow' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (firestoreService.saveStudioClassDraft as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'draft_001',
      studioId: 'studio_chiswick_01',
      className: 'Hot Ashtanga Primary',
      status: 'draft',
    });
    (firestoreService.saveBrandClassTemplate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tpl_001',
      companyId: 'comp_zen_01',
      className: 'Hot Ashtanga Primary Blueprint',
    });
    (firestoreService.publishStudioClass as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'cls_001',
        studioId: 'studio_chiswick_01',
        className: 'Hot Ashtanga Primary',
        status: 'published',
      },
    ]);
  });

  it('renders class creator form controls', () => {
    render(
      <CreateClassView
        studio={mockStudio}
        onBack={vi.fn()}
        onSaveSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('🧘 Class Schedule Creator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Hot Ashtanga Primary Series')).toBeInTheDocument();
    expect(screen.getByText('📝 Save Draft')).toBeInTheDocument();
    expect(screen.getByText('📋 Save as Template')).toBeInTheDocument();
    expect(screen.getByText('🚀 Publish Live Class')).toBeInTheDocument();
  });

  it('saves class draft successfully', async () => {
    const handleSaveSuccess = vi.fn();
    render(
      <CreateClassView
        studio={mockStudio}
        onBack={vi.fn()}
        onSaveSuccess={handleSaveSuccess}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Hot Ashtanga Primary Series'), {
      target: { value: 'Hot Ashtanga Primary' },
    });

    fireEvent.click(screen.getByText('📝 Save Draft'));

    await waitFor(() => {
      expect(firestoreService.saveStudioClassDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          studioId: 'studio_chiswick_01',
          className: 'Hot Ashtanga Primary',
          status: 'draft',
        })
      );
      expect(handleSaveSuccess).toHaveBeenCalledWith('draft');
    });
  });

  it('saves brand class template blueprint successfully', async () => {
    const handleSaveSuccess = vi.fn();
    render(
      <CreateClassView
        studio={mockStudio}
        onBack={vi.fn()}
        onSaveSuccess={handleSaveSuccess}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Hot Ashtanga Primary Series'), {
      target: { value: 'Hot Ashtanga Primary Blueprint' },
    });

    fireEvent.click(screen.getByText('📋 Save as Template'));

    await waitFor(() => {
      expect(firestoreService.saveBrandClassTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp_zen_01',
          className: 'Hot Ashtanga Primary Blueprint',
        })
      );
      expect(handleSaveSuccess).toHaveBeenCalledWith('template');
    });
  });

  it('publishes live class schedule successfully', async () => {
    const handleSaveSuccess = vi.fn();
    render(
      <CreateClassView
        studio={mockStudio}
        onBack={vi.fn()}
        onSaveSuccess={handleSaveSuccess}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Hot Ashtanga Primary Series'), {
      target: { value: 'Hot Vinyasa 60m' },
    });

    fireEvent.click(screen.getByText('🚀 Publish Live Class'));

    await waitFor(() => {
      expect(firestoreService.publishStudioClass).toHaveBeenCalledWith(
        expect.objectContaining({
          studioId: 'studio_chiswick_01',
          className: 'Hot Vinyasa 60m',
          teacherId: 'teacher_elena',
        })
      );
      expect(handleSaveSuccess).toHaveBeenCalledWith('published');
    });
  });
});
