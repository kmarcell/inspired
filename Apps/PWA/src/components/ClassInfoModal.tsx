import React from 'react';
import { StudioClass } from '../types';

interface ClassInfoModalProps {
  selectedClass: StudioClass | null;
  isJoined?: boolean;
  onClose: () => void;
  onBook: (cls: StudioClass) => void;
  onSelectTeacher?: (teacherId: string) => void;
}

export const ClassInfoModal: React.FC<ClassInfoModalProps> = ({
  selectedClass,
  isJoined = true,
  onClose,
  onBook,
  onSelectTeacher,
}) => {
  if (!selectedClass) return null;

  const renderClimateBadge = () => {
    switch (selectedClass.roomClimate) {
      case 'hot_studio':
        return {
          icon: '🔥',
          title: 'HOT STUDIO',
          text: `${selectedClass.temperatureCelsius || 35}°C Hot Studio`,
          color: 'text-amber-400',
        };
      case 'air_conditioned':
        return {
          icon: '❄️',
          title: 'AIR CONDITIONED',
          text: 'Air Conditioned (Cool)',
          color: 'text-cyan-400',
        };
      case 'heated_room':
        return {
          icon: '🌡️',
          title: 'HEATED ROOM',
          text: 'Heated Room',
          color: 'text-orange-400',
        };
      case 'outdoor':
        return {
          icon: '☀️',
          title: 'OUTDOOR SESSION',
          text: 'Outdoor Session',
          color: 'text-yellow-400',
        };
      case 'natural_ambient':
      default:
        return {
          icon: '🍃',
          title: 'ROOM CLIMATE',
          text: 'Natural Ambient Temp',
          color: 'text-emerald-400',
        };
    }
  };

  const climateInfo = renderClimateBadge();
  const openSlots = selectedClass.capacity - selectedClass.bookedCount;
  const isFull = openSlots <= 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      data-testid="class-info-modal-backdrop"
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 p-6 text-slate-900 dark:text-slate-100 shadow-2xl shadow-indigo-950/50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              ℹ️ Class Information
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedClass.className}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Teacher Line */}
        <div className="py-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white">
            {selectedClass.teacherName.charAt(0)}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Taught by{' '}
            <button
              type="button"
              onClick={() => onSelectTeacher?.(selectedClass.teacherId)}
              className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500 dark:hover:text-indigo-300 transition"
            >
              {selectedClass.teacherName}
            </button>
          </p>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-3 py-2">
          {/* Time */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Time & Duration</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{selectedClass.startTime} – {selectedClass.endTime}</p>
          </div>

          {/* Adaptive Climate */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${climateInfo.color}`}>
              {climateInfo.title}
            </p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
              <span>{climateInfo.icon}</span> {climateInfo.text}
            </p>
          </div>

          {/* Class Style */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Class Style</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{selectedClass.styleName || 'Yoga Flow'}</p>
          </div>

          {/* Skill Level */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Skill Level</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{selectedClass.skillLevel || 'All Levels Welcome'}</p>
          </div>
        </div>

        {/* Description */}
        <div className="pt-3 pb-2">
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">About This Class</p>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedClass.classTypeDescription}</p>
        </div>

        {/* Equipment Needed */}
        {selectedClass.equipmentNeeded && (
          <div className="pb-4">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">What to Bring</p>
            <p className="text-xs text-slate-700 dark:text-slate-300">🧘 {selectedClass.equipmentNeeded}</p>
          </div>
        )}

        {/* Footer Action */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              onBook(selectedClass);
              onClose();
            }}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-2 ${
              !isJoined
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 shadow-none'
                : isFull
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/40'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/40'
            }`}
          >
            <span>{!isJoined ? '🔒' : ''}</span>
            <span>
              {!isJoined
                ? `Join Studio to ${isFull ? 'Join Waitlist' : 'Book Class'}`
                : isFull
                ? `Join Waitlist (${selectedClass.waitlist.length} Waiting)`
                : `Book This Class (${openSlots} Open)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
