import React, { useState } from 'react';
import { 
  YogaStudio, 
  BrandClassTemplate, 
  RecurrenceFrequency, 
  DayOfWeekPill 
} from '../types';
import { firestoreService } from '../services/firestoreService';

interface CreateClassFromTemplateModalProps {
  template: BrandClassTemplate;
  activeStudio: YogaStudio;
  availableStudios?: YogaStudio[];
  onClose: () => void;
  onSuccess: () => void;
}

const DAY_PILLS: DayOfWeekPill[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CreateClassFromTemplateModal: React.FC<CreateClassFromTemplateModalProps> = ({
  template,
  activeStudio,
  availableStudios = [activeStudio],
  onClose,
  onSuccess,
}) => {
  const [selectedStudioId, setSelectedStudioId] = useState(activeStudio.id);

  // Find target studio object
  const currentTargetStudio = availableStudios.find((s) => s.id === selectedStudioId) || activeStudio;
  const studioTeachers = currentTargetStudio.assignedTeachers && currentTargetStudio.assignedTeachers.length > 0
    ? currentTargetStudio.assignedTeachers
    : [
        { id: 'teacher_elena', displayName: 'Elena Rostova', specialty: 'Hot Ashtanga' },
        { id: 'teacher_maryia', displayName: 'Maryia Vane', specialty: 'Vinyasa Flow' },
        { id: 'teacher_david', displayName: 'David Kim', specialty: 'Yin & Restorative' },
      ];

  const [teacherId, setTeacherId] = useState(studioTeachers[0]?.id || '');

  // Schedule Inputs
  const todayIso = new Date().toISOString().split('T')[0];
  const [dateString, setDateString] = useState(todayIso);
  const [startTime, setStartTime] = useState('07:30 AM');
  
  // Recurrence
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [selectedDays, setSelectedDays] = useState<DayOfWeekPill[]>(['Mon', 'Wed', 'Fri']);

  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleDayPill = (day: DayOfWeekPill) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const calculateEndTime = (start: string, duration: number): string => {
    try {
      const match = start.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return start;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const totalMinutes = hours * 60 + minutes + duration;
      let endHours = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      const endAmpm = endHours >= 12 ? 'PM' : 'AM';
      endHours = endHours % 12 || 12;

      return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')} ${endAmpm}`;
    } catch {
      return start;
    }
  };

  const handlePublish = async () => {
    if (!teacherId) {
      setErrorMsg('Please select a teacher for the target studio.');
      return;
    }
    setIsPublishing(true);
    setErrorMsg(null);
    try {
      const selectedTeacherObj = studioTeachers.find((t) => t.id === teacherId);
      const finalTeacherName = selectedTeacherObj ? selectedTeacherObj.displayName : (studioTeachers[0]?.displayName || 'Elena Rostova');

      const endTime = calculateEndTime(startTime, template.durationMinutes);
      await firestoreService.publishStudioClass({
        studioId: currentTargetStudio.id,
        companyId: currentTargetStudio.companyId || template.companyId,
        className: template.className,
        styleName: template.styleName || template.className,
        classTypeDescription: template.classTypeDescription,
        description: template.description || '',
        teacherId,
        teacherName: finalTeacherName,
        dateString,
        startTime,
        endTime,
        durationMinutes: template.durationMinutes,
        capacity: template.capacity,
        roomClimate: template.roomClimate,
        temperatureCelsius: template.temperatureCelsius,
        skillLevel: template.skillLevel,
        equipmentNeeded: template.equipmentNeeded,
        currencyAcceptancePolicyMode: template.currencyAcceptancePolicyMode || 'acceptAll',
        acceptedCurrencyIds: template.acceptedCurrencyIds || [],
        recurrence: {
          frequency,
          daysOfWeek: selectedDays,
          endCondition: 'never',
        },
      });

      onSuccess();
    } catch (err: any) {
      console.error('Failed to create class from template:', err);
      setErrorMsg(err.message || 'Failed to schedule class from template.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-slate-900 dark:text-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="px-3 py-1 text-[10px] rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 font-bold uppercase tracking-wider dark:border-amber-500/30">
              📋 Brand Template Blueprint
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Schedule: {template.className}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {template.durationMinutes}m • {template.capacity} Capacity • {template.roomClimate === 'hot_studio' ? `🔥 ${template.temperatureCelsius}°C` : template.roomClimate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200 text-xs flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-700 dark:text-red-400 hover:opacity-80">✕</button>
          </div>
        )}

        {/* Blueprint Overview Pill */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-amber-800 dark:text-amber-400">📌 Teacher-Agnostic Blueprint Rule</p>
          <p className="text-slate-600 dark:text-slate-400">
            This template stores class specs across the brand network. Assign a teacher and start date below to instantiate a live recurring schedule for your target studio.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Target Studio Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Target Studio Branch
            </label>
            <select
              value={selectedStudioId}
              onChange={(e) => setSelectedStudioId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-sm"
            >
              {availableStudios.map((st) => (
                <option key={st.id} value={st.id}>
                  🏢 {st.name} ({st.location_prefix})
                </option>
              ))}
            </select>
          </div>

          {/* Location Teacher Assignment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Assign Location Teacher <span className="text-red-500">*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-sm"
            >
              {studioTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  🧘 {t.displayName} {t.specialty ? `(${t.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                First Class Date
              </label>
              <input
                type="date"
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="07:30 AM"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Recurrence Engine */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Recurrence Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('none')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'none'
                    ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-slate-700 dark:border-slate-500 dark:text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                1️⃣ Single
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'weekly'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                📅 Weekly
              </button>
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'daily'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                ☀️ Daily
              </button>
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'monthly'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                🗓️ Monthly
              </button>
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAY_PILLS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayPill(day)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.03]"
          >
            {isPublishing ? 'Publishing Schedule...' : '🚀 Instantiate & Publish Live'}
          </button>
        </div>

      </div>
    </div>
  );
};
