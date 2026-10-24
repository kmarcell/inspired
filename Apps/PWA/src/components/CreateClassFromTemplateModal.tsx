import React, { useState, useEffect } from 'react';
import { 
  YogaStudio, 
  BrandClassTemplate, 
  RecurrenceFrequency, 
  DayOfWeekPill 
} from '../types';
import { firestoreService } from '../services/firestoreService';
import { colorTokens } from '../theme/colorTokens';

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
  const studioTeachers = (currentTargetStudio.assignedTeachers && currentTargetStudio.assignedTeachers.length > 0)
    ? currentTargetStudio.assignedTeachers
    : [{ id: currentTargetStudio.ownerId || 'studio_staff', displayName: `${currentTargetStudio.name} Staff`, specialty: 'Resident Teacher' }];

  const [teacherId, setTeacherId] = useState(studioTeachers[0]?.id || '');

  // Synchronize teacher selection when target studio branch changes
  useEffect(() => {
    const target = availableStudios.find((s) => s.id === selectedStudioId) || activeStudio;
    const teachers = (target.assignedTeachers && target.assignedTeachers.length > 0)
      ? target.assignedTeachers
      : [{ id: target.ownerId || 'studio_staff', displayName: `${target.name} Staff`, specialty: 'Resident Teacher' }];
    setTeacherId(teachers[0]?.id || '');
  }, [selectedStudioId, availableStudios, activeStudio]);

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
      const finalTeacherName = selectedTeacherObj ? selectedTeacherObj.displayName : (studioTeachers[0]?.displayName || `${currentTargetStudio.name} Staff`);

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
    <div className={colorTokens.surfaces.backdrop}>
      <div className={`${colorTokens.surfaces.modal} max-w-2xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200`}>
        
        {/* Header */}
        <div className={`flex items-start justify-between ${colorTokens.borders.dividerBottom} pb-4`}>
          <div>
            <span className={`px-3 py-1 text-[10px] rounded-full ${colorTokens.badges.amber} font-bold uppercase tracking-wider`}>
              📋 Brand Template Blueprint
            </span>
            <h2 className={`text-xl font-bold ${colorTokens.text.primary} mt-1`}>
              Schedule: {template.className}
            </h2>
            <p className={`text-xs ${colorTokens.text.subtle}`}>
              {template.durationMinutes}m • {template.capacity} Capacity • {template.roomClimate === 'hot_studio' ? `🔥 ${template.temperatureCelsius}°C` : template.roomClimate}
            </p>
          </div>
          <button
            onClick={onClose}
            className={colorTokens.buttons.secondary}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className={`p-4 rounded-xl ${colorTokens.surfaces.roseNotice} text-xs flex items-center justify-between`}>
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-700 dark:text-red-400 hover:opacity-80">✕</button>
          </div>
        )}

        {/* Blueprint Overview Pill */}
        <div className={`p-4 rounded-2xl ${colorTokens.surfaces.amberNotice} text-xs space-y-1`}>
          <p className="font-semibold text-amber-800 dark:text-amber-400">📌 Teacher-Agnostic Blueprint Rule</p>
          <p className="text-slate-600 dark:text-slate-400">
            This template stores class specs across the brand network. Assign a teacher and start date below to instantiate a live recurring schedule for your target studio.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Target Studio Branch */}
          <div>
            <label className={colorTokens.inputs.label}>
              Target Studio Branch
            </label>
            <select
              value={selectedStudioId}
              onChange={(e) => setSelectedStudioId(e.target.value)}
              className={colorTokens.inputs.selectAmberFocus}
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
            <label className={colorTokens.inputs.label}>
              Assign Location Teacher <span className="text-red-500">*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={colorTokens.inputs.selectAmberFocus}
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
              <label className={colorTokens.inputs.label}>
                First Class Date
              </label>
              <input
                type="date"
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className={colorTokens.inputs.selectAmberFocus}
              />
            </div>

            <div>
              <label className={colorTokens.inputs.label}>
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="07:30 AM"
                className={colorTokens.inputs.selectAmberFocus}
              />
            </div>
          </div>

          {/* Recurrence Engine */}
          <div>
            <label className={colorTokens.inputs.label}>
              Recurrence Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('none')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'none'
                    ? colorTokens.tabs.activeSlate
                    : colorTokens.tabs.inactivePill
                }`}
              >
                1️⃣ Single
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'weekly'
                    ? colorTokens.badges.amber
                    : colorTokens.tabs.inactivePill
                }`}
              >
                📅 Weekly
              </button>
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'daily'
                    ? colorTokens.badges.amber
                    : colorTokens.tabs.inactivePill
                }`}
              >
                ☀️ Daily
              </button>
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                  frequency === 'monthly'
                    ? colorTokens.badges.amber
                    : colorTokens.tabs.inactivePill
                }`}
              >
                🗓️ Monthly
              </button>
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className={colorTokens.inputs.label}>
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
                          : colorTokens.tabs.inactivePill
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
        <div className={`flex items-center justify-end gap-3 pt-4 ${colorTokens.borders.dividerTop}`}>
          <button
            type="button"
            onClick={onClose}
            className={colorTokens.buttons.secondaryText}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className={colorTokens.buttons.primaryGradient}
          >
            {isPublishing ? 'Publishing Schedule...' : '🚀 Instantiate & Publish Live'}
          </button>
        </div>

      </div>
    </div>
  );
};
