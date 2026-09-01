import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClassInfoModal } from './ClassInfoModal';
import { StudioClass } from '../types';

const mockClass: StudioClass = {
  id: 'class_101',
  studioId: 'studio_askew_001',
  className: 'Vinyasa Flow',
  styleName: 'Dynamic Vinyasa',
  classTypeDescription: 'A fluid, breath-synchronized sequence designed to build core strength.',
  teacherId: 'user_maryia',
  teacherName: 'Maryia Sharma',
  dayOfWeek: 1,
  dateString: '2026-08-31',
  startTime: '10:00 AM',
  endTime: '11:00 AM',
  capacity: 24,
  bookedCount: 14,
  waitlist: [],
  roomClimate: 'natural_ambient',
  skillLevel: 'All Levels Welcome',
  equipmentNeeded: 'Yoga Mat & Towel',
};

describe('ClassInfoModal Component', () => {
  it('renders nothing when selectedClass is null', () => {
    const { container } = render(
      <ClassInfoModal selectedClass={null} onClose={vi.fn()} onBook={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders class details and natural ambient climate badge', () => {
    render(
      <ClassInfoModal selectedClass={mockClass} onClose={vi.fn()} onBook={vi.fn()} />
    );

    expect(screen.getByText('Vinyasa Flow')).toBeInTheDocument();
    expect(screen.getByText('Maryia Sharma')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM – 11:00 AM')).toBeInTheDocument();
    expect(screen.getByText(/Natural Ambient Temp/i)).toBeInTheDocument();
    expect(screen.getByText(/Book This Class \(10 Open\)/i)).toBeInTheDocument();
  });

  it('renders hot studio climate badge when roomClimate is hot_studio', () => {
    const hotClass: StudioClass = {
      ...mockClass,
      roomClimate: 'hot_studio',
      temperatureCelsius: 35,
    };

    render(
      <ClassInfoModal selectedClass={hotClass} onClose={vi.fn()} onBook={vi.fn()} />
    );

    expect(screen.getByText(/35°C Hot Studio/i)).toBeInTheDocument();
  });

  it('triggers onClose when close button or backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ClassInfoModal selectedClass={mockClass} onClose={handleClose} onBook={vi.fn()} />
    );

    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('class-info-modal-backdrop'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('triggers onBook when book button is clicked', () => {
    const handleBook = vi.fn();
    const handleClose = vi.fn();

    render(
      <ClassInfoModal selectedClass={mockClass} onClose={handleClose} onBook={handleBook} />
    );

    fireEvent.click(screen.getByText(/Book This Class/i));
    expect(handleBook).toHaveBeenCalledWith(mockClass);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
