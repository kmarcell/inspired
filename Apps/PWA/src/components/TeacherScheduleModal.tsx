import React, { useState } from 'react';
import { StudioClass } from '../types';

export interface TeachingStudioSummary {
  id: string;
  name: string;
  location_prefix: string;
}

interface TeacherScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  teacherUsername: string;
  teachingStudios: TeachingStudioSummary[];
  classes: StudioClass[];
  onBookClass?: (classItem: StudioClass) => void;
}

export const TeacherScheduleModal: React.FC<TeacherScheduleModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  teacherUsername,
  teachingStudios,
  classes,
  onBookClass,
}) => {
  const [selectedStudioId, setSelectedStudioId] = useState<string>('all');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!isOpen) return null;

  // Filter classes by studio
  const filteredByStudio = classes.filter((c) => {
    if (selectedStudioId === 'all') return true;
    return c.studioId === selectedStudioId;
  });

  // Calculate day labels for current week (Mon-Sun)
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sun
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays = daysOfWeek.map((dayLabel, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);
    const dayNumber = dayDate.getDate();
    const dateString = dayDate.toISOString().split('T')[0];
    const dayClasses = filteredByStudio.filter((c) => c.dateString === dateString);
    return {
      label: dayLabel,
      dateNumber: dayNumber,
      dateString,
      hasClasses: dayClasses.length > 0,
      classes: dayClasses,
    };
  });

  const selectedDay = weekDays[selectedDayIndex] || weekDays[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Handle bar indicator for mobile */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📅</span> {teacherName} — Schedule
            </h3>
            <p className="text-xs text-slate-400">
              Multi-Studio Calendar Schedule for @{teacherUsername}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close Schedule Modal"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Horizontally Scrollable Studio Location Filter Bar */}
          <div>
            <label className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">
              Filter by Studio Location (Horizontally Scrollable ➔):
            </label>
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedStudioId('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedStudioId === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                All Studios ({classes.length})
              </button>

              {teachingStudios.map((st) => {
                const count = classes.filter((c) => c.studioId === st.id).length;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStudioId(st.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedStudioId === st.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {st.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week Switcher Header */}
          <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-xs font-bold text-slate-200">
            <button className="text-indigo-400 hover:text-indigo-300">◀</button>
            <span>Aug 31 – Sep 6, 2026</span>
            <button className="text-indigo-400 hover:text-indigo-300">▶</button>
          </div>

          {/* 7-Day Selector Pills Row */}
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  key={day.label}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition relative ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80">{day.label}</span>
                  <span className="text-sm font-extrabold">{day.dateNumber}</span>
                  {day.hasClasses && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-emerald-300' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Filtered Class List for Selected Day */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Classes on {selectedDay.label}, {selectedDay.dateString} ({selectedDay.classes.length} Sessions)
            </h4>

            {selectedDay.classes.length === 0 ? (
              <div className="p-6 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No classes scheduled for this day at selected locations.
              </div>
            ) : (
              selectedDay.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>
                      {cls.startTime} – {cls.endTime}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">
                      🔥 Hot Studio
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-extrabold text-slate-100">{cls.title}</h5>
                    <p className="text-xs text-indigo-300 font-semibold">🏢 {cls.studioName}</p>
                  </div>

                  <button
                    onClick={() => onBookClass?.(cls)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition"
                  >
                    Book Class (1 Studio Credit) ➔
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
