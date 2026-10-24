import React, { useState, useEffect } from 'react';
import { 
  YogaStudio, 
  StudioClass, 
  BrandClassTemplate, 
  CompanyCurrency, 
  RoomClimateType, 
  RecurrenceFrequency, 
  DayOfWeekPill, 
  RecurrenceEndCondition, 
  CurrencyAcceptancePolicyMode 
} from '../types';
import { firestoreService } from '../services/firestoreService';

interface CreateClassViewProps {
  studio: YogaStudio;
  companyCurrencies?: CompanyCurrency[];
  initialDraft?: StudioClass | null;
  initialTemplate?: BrandClassTemplate | null;
  onBack: () => void;
  onSaveSuccess: (action: 'draft' | 'template' | 'published') => void;
}

const CATEGORY_OPTIONS = [
  'Hot Yoga',
  'Ashtanga',
  'Vinyasa',
  'Yin Yoga',
  'Hatha Yoga',
  'Breathwork',
  'Sound Bath',
  'Pilates & Flow',
];

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

const LEVEL_OPTIONS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const DAY_PILLS: DayOfWeekPill[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CreateClassView: React.FC<CreateClassViewProps> = ({
  studio,
  companyCurrencies = [],
  initialDraft = null,
  initialTemplate = null,
  onBack,
  onSaveSuccess,
}) => {
  // Form State
  const [className, setClassName] = useState(initialDraft?.className || initialTemplate?.className || '');
  const [styleName, setStyleName] = useState(initialDraft?.styleName || initialTemplate?.styleName || 'Hot Yoga');
  const [classTypeDescription, setClassTypeDescription] = useState(
    initialDraft?.classTypeDescription || initialTemplate?.classTypeDescription || 'Dynamic practice focused on strength, alignment, and mindful breathing.'
  );
  const [description, setDescription] = useState(initialDraft?.description || initialTemplate?.description || '');
  
  // Teacher Assignment
  const studioTeachers = studio.assignedTeachers && studio.assignedTeachers.length > 0
    ? studio.assignedTeachers
    : [
        { id: 'teacher_elena', displayName: 'Elena Rostova', specialty: 'Hot Ashtanga' },
        { id: 'teacher_maryia', displayName: 'Maryia Vane', specialty: 'Vinyasa Flow' },
        { id: 'teacher_david', displayName: 'David Kim', specialty: 'Yin & Restorative' },
      ];

  const [teacherId, setTeacherId] = useState(initialDraft?.teacherId || studioTeachers[0]?.id || '');
  const [teacherName, setTeacherName] = useState(initialDraft?.teacherName || studioTeachers[0]?.displayName || 'Elena Rostova');

  // Schedule Details
  const todayIso = new Date().toISOString().split('T')[0];
  const [dateString, setDateString] = useState(initialDraft?.dateString || todayIso);
  const [startTime, setStartTime] = useState(initialDraft?.startTime || '07:30 AM');
  const [durationMinutes, setDurationMinutes] = useState(initialDraft?.durationMinutes || initialTemplate?.durationMinutes || 60);
  const [capacity, setCapacity] = useState(initialDraft?.capacity || initialTemplate?.capacity || 20);

  // Climate & Equipment
  const [roomClimate, setRoomClimate] = useState<RoomClimateType>(
    initialDraft?.roomClimate || initialTemplate?.roomClimate || 'hot_studio'
  );
  const [temperatureCelsius, setTemperatureCelsius] = useState<number>(
    initialDraft?.temperatureCelsius ?? initialTemplate?.temperatureCelsius ?? 35
  );
  const [skillLevel, setSkillLevel] = useState(initialDraft?.skillLevel || initialTemplate?.skillLevel || 'All Levels');
  const [equipmentNeeded, setEquipmentNeeded] = useState(
    initialDraft?.equipmentNeeded || initialTemplate?.equipmentNeeded || 'Yoga Mat & Towel'
  );

  // Outlook Recurrence Engine
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initialDraft?.recurrence?.frequency || 'weekly'
  );
  const [selectedDays, setSelectedDays] = useState<DayOfWeekPill[]>(
    initialDraft?.recurrence?.daysOfWeek || ['Mon', 'Wed', 'Fri']
  );
  const [endCondition, setEndCondition] = useState<RecurrenceEndCondition>(
    initialDraft?.recurrence?.endCondition || 'never'
  );
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(
    initialDraft?.recurrence?.endAfterOccurrences || 12
  );
  const [endDate, setEndDate] = useState(initialDraft?.recurrence?.endDate || '');

  // Currency & Pass Acceptance Policy
  const [currencyPolicyMode, setCurrencyPolicyMode] = useState<CurrencyAcceptancePolicyMode>(
    initialDraft?.currencyAcceptancePolicyMode || initialTemplate?.currencyAcceptancePolicyMode || 'acceptAll'
  );
  const [acceptedCurrencyIds, setAcceptedCurrencyIds] = useState<string[]>(
    initialDraft?.acceptedCurrencyIds || initialTemplate?.acceptedCurrencyIds || []
  );

  // Status & Async State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync teacher name when teacherId changes
  useEffect(() => {
    const found = studioTeachers.find((t) => t.id === teacherId);
    if (found) {
      setTeacherName(found.displayName);
    }
  }, [teacherId]);

  const toggleDayPill = (day: DayOfWeekPill) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleCurrencyId = (id: string) => {
    if (acceptedCurrencyIds.includes(id)) {
      setAcceptedCurrencyIds(acceptedCurrencyIds.filter((cId) => cId !== id));
    } else {
      setAcceptedCurrencyIds([...acceptedCurrencyIds, id]);
    }
  };

  // Calculate End Time from Start Time + Duration
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

  const handleSaveDraft = async () => {
    if (!className.trim()) {
      setErrorMsg('Please enter a class title before saving a draft.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const endTime = calculateEndTime(startTime, durationMinutes);
      await firestoreService.saveStudioClassDraft({
        id: initialDraft?.id,
        studioId: studio.id,
        companyId: studio.companyId,
        className: className.trim(),
        title: className.trim(),
        status: 'draft',
        styleName,
        classTypeDescription: classTypeDescription.trim(),
        description: description.trim(),
        teacherId,
        teacherName,
        dateString,
        startTime,
        endTime,
        durationMinutes,
        capacity,
        roomClimate,
        temperatureCelsius: roomClimate === 'hot_studio' || roomClimate === 'heated_room' ? temperatureCelsius : undefined,
        skillLevel,
        equipmentNeeded,
        currencyAcceptancePolicyMode: currencyPolicyMode,
        acceptedCurrencyIds: currencyPolicyMode === 'customSelected' ? acceptedCurrencyIds : [],
        recurrence: {
          frequency,
          daysOfWeek: selectedDays,
          endCondition,
          endAfterOccurrences: endCondition === 'occurrences' ? endAfterOccurrences : undefined,
          endDate: endCondition === 'date' ? endDate : undefined,
        },
      });
      onSaveSuccess('draft');
    } catch (err: any) {
      console.error('Save draft error:', err);
      setErrorMsg(err.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!className.trim()) {
      setErrorMsg('Please enter a class title before saving as template.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await firestoreService.saveBrandClassTemplate({
        id: initialTemplate?.id,
        companyId: studio.companyId,
        studioId: studio.id,
        className: className.trim(),
        styleName,
        classTypeDescription: classTypeDescription.trim(),
        description: description.trim(),
        durationMinutes,
        capacity,
        roomClimate,
        temperatureCelsius: roomClimate === 'hot_studio' || roomClimate === 'heated_room' ? temperatureCelsius : undefined,
        skillLevel,
        equipmentNeeded,
        currencyAcceptancePolicyMode: currencyPolicyMode,
        acceptedCurrencyIds: currencyPolicyMode === 'customSelected' ? acceptedCurrencyIds : [],
      });
      onSaveSuccess('template');
    } catch (err: any) {
      console.error('Save template error:', err);
      setErrorMsg(err.message || 'Failed to save template blueprint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishLive = async () => {
    if (!className.trim()) {
      setErrorMsg('Please enter a class title.');
      return;
    }
    if (!teacherId) {
      setErrorMsg('Please assign a teacher to publish this class.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const endTime = calculateEndTime(startTime, durationMinutes);
      await firestoreService.publishStudioClass({
        studioId: studio.id,
        companyId: studio.companyId,
        className: className.trim(),
        styleName,
        classTypeDescription: classTypeDescription.trim(),
        description: description.trim(),
        teacherId,
        teacherName,
        dateString,
        startTime,
        endTime,
        durationMinutes,
        capacity,
        roomClimate,
        temperatureCelsius: roomClimate === 'hot_studio' || roomClimate === 'heated_room' ? temperatureCelsius : undefined,
        skillLevel,
        equipmentNeeded,
        currencyAcceptancePolicyMode: currencyPolicyMode,
        acceptedCurrencyIds: currencyPolicyMode === 'customSelected' ? acceptedCurrencyIds : [],
        recurrence: {
          frequency,
          daysOfWeek: selectedDays,
          endCondition,
          endAfterOccurrences: endCondition === 'occurrences' ? endAfterOccurrences : undefined,
          endDate: endCondition === 'date' ? endDate : undefined,
        },
      });

      // If publishing from draft, remove draft copy
      if (initialDraft?.id) {
        await firestoreService.deleteStudioClassDraft(studio.id, initialDraft.id).catch(() => {});
      }

      onSaveSuccess('published');
    } catch (err: any) {
      console.error('Publish class error:', err);
      setErrorMsg(err.message || 'Failed to publish live class schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-slate-900 dark:text-slate-100">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🧘 Class Schedule Creator</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {studio.name} ({studio.location_prefix}) {studio.parentBrandName ? `• ${studio.parentBrandName}` : ''}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold dark:border-emerald-500/30">
            Studio Creator Mode
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200 text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 dark:text-red-400 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Main Form Sections Container */}
      <div className="space-y-6">

        {/* Section 1: Basic Class Information */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span>📝 Class Overview & Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Class Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Hot Ashtanga Primary Series"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Yoga Category / Style
              </label>
              <select
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Assigned Teacher <span className="text-red-500">*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {studioTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  🧘 {t.displayName} {t.specialty ? `(${t.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Class Subtitle / Summary
            </label>
            <input
              type="text"
              value={classTypeDescription}
              onChange={(e) => setClassTypeDescription(e.target.value)}
              placeholder="e.g. Traditional 90-min primary series in 35°C heat."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Full Class Description & Philosophy
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what yogis should expect, posture focus, energy level, and recommendations..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Section 2: Room Climate & Spec Controls */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <span>🌡️ Room Climate & Studio Environment</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Room Climate Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setRoomClimate('hot_studio')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'hot_studio'
                    ? 'bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-500/20 dark:border-rose-500 dark:text-rose-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                🔥 Hot Studio
              </button>
              <button
                type="button"
                onClick={() => setRoomClimate('heated_room')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'heated_room'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                🌡️ Heated Room
              </button>
              <button
                type="button"
                onClick={() => setRoomClimate('air_conditioned')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'air_conditioned'
                    ? 'bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-500/20 dark:border-cyan-500 dark:text-cyan-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                ❄️ Air Conned
              </button>
              <button
                type="button"
                onClick={() => setRoomClimate('natural_ambient')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'natural_ambient'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-500/20 dark:border-emerald-500 dark:text-emerald-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                🍃 Ambient
              </button>
              <button
                type="button"
                onClick={() => setRoomClimate('outdoor')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'outdoor'
                    ? 'bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-500/20 dark:border-sky-500 dark:text-sky-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                ☀️ Outdoor
              </button>
            </div>
          </div>

          {(roomClimate === 'hot_studio' || roomClimate === 'heated_room') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Target Temperature (°C)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="20"
                  max="45"
                  value={temperatureCelsius}
                  onChange={(e) => setTemperatureCelsius(parseInt(e.target.value, 10) || 35)}
                  className="w-32 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-sm text-amber-700 dark:text-amber-400 font-semibold">°C (Celsius)</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Duration (Minutes)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {DURATION_OPTIONS.map((dur) => (
                  <option key={dur} value={dur}>
                    ⏱️ {dur} Minutes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Max Capacity (Yogis)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 20)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Equipment / What to Bring
            </label>
            <input
              type="text"
              value={equipmentNeeded}
              onChange={(e) => setEquipmentNeeded(e.target.value)}
              placeholder="e.g. Yoga Mat, Large Water Bottle & Sweat Towel"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Section 3: Outlook Calendar Recurrence Engine */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
            <span>📅 Outlook Calendar Recurrence Engine</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                First Session Date
              </label>
              <input
                type="date"
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
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
                placeholder="e.g. 07:30 AM"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Recurrence Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('none')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'none'
                    ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-slate-700 dark:border-slate-500 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                1️⃣ Single Session
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'weekly'
                    ? 'bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-500/20 dark:border-cyan-500 dark:text-cyan-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                📅 Weekly Recurring
              </button>
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'daily'
                    ? 'bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-500/20 dark:border-cyan-500 dark:text-cyan-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                ☀️ Daily Recurring
              </button>
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'monthly'
                    ? 'bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-500/20 dark:border-cyan-500 dark:text-cyan-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                🗓️ Monthly
              </button>
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Repeat On Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAY_PILLS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayPill(day)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {frequency !== 'none' && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Recurrence End Condition
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="endCond"
                    checked={endCondition === 'never'}
                    onChange={() => setEndCondition('never')}
                    className="accent-cyan-500"
                  />
                  <span>Never (Ongoing schedule)</span>
                </label>

                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="endCond"
                    checked={endCondition === 'occurrences'}
                    onChange={() => setEndCondition('occurrences')}
                    className="accent-cyan-500"
                  />
                  <span>End after specific number of occurrences</span>
                  {endCondition === 'occurrences' && (
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={endAfterOccurrences}
                      onChange={(e) => setEndAfterOccurrences(parseInt(e.target.value, 10) || 12)}
                      className="w-20 px-3 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  )}
                </label>

                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="endCond"
                    checked={endCondition === 'date'}
                    onChange={() => setEndCondition('date')}
                    className="accent-cyan-500"
                  />
                  <span>End on specific cutoff date</span>
                  {endCondition === 'date' && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Currency Acceptance Policy Selector */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <span>💳 Class Currency & Pass Acceptance Selector</span>
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <input
                type="radio"
                name="currencyPolicy"
                checked={currencyPolicyMode === 'acceptAll'}
                onChange={() => setCurrencyPolicyMode('acceptAll')}
                className="mt-1 accent-purple-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Accept All Studio Currencies & Passes</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Default mode: Yogis can book this class using any valid credit pack, drop-in rate, or unlimited pass accepted by this studio branch.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <input
                type="radio"
                name="currencyPolicy"
                checked={currencyPolicyMode === 'customSelected'}
                onChange={() => setCurrencyPolicyMode('customSelected')}
                className="mt-1 accent-purple-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Custom Selected Currencies & Passes</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Restrict booking for this class exclusively to specific credit packs or drop-in tiers.
                </p>
              </div>
            </label>
          </div>

          {currencyPolicyMode === 'customSelected' && (
            <div className="pt-2 pl-4 space-y-2 border-l-2 border-purple-500/40">
              <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2">
                Check Accepted Currencies for this Class:
              </label>
              {companyCurrencies.length === 0 ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ No currencies found in catalog. Add pricing currencies in Studio/Brand settings.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {companyCurrencies.map((curr) => {
                    const isChecked = acceptedCurrencyIds.includes(curr.id);
                    return (
                      <label
                        key={curr.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer hover:border-purple-500/50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCurrencyId(curr.id)}
                            className="accent-purple-500"
                          />
                          <span className="font-semibold text-slate-900 dark:text-white">{curr.title}</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            ({curr.creditCount ? `${curr.creditCount} Credits` : 'Unlimited'} • {curr.currencySymbol}{curr.basePriceAmount.toFixed(2)})
                          </span>
                        </div>
                        {curr.studioId && (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 text-[10px]">
                            Studio Override
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 5: 3 Save Action Buttons Bar */}
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 backdrop-blur-md">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200 text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>📝 Save Draft</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveTemplate}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:border-amber-500/40 dark:text-amber-300 text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>📋 Save as Template</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublishLive}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.03] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <span>🚀 Publish Live Class</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
