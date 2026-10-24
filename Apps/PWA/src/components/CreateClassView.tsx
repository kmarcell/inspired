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
import { colorTokens } from '../theme/colorTokens';

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
  const studioTeachers = (studio.assignedTeachers && studio.assignedTeachers.length > 0)
    ? studio.assignedTeachers
    : [{ id: studio.ownerId || 'studio_staff', displayName: `${studio.name} Staff`, specialty: 'Resident Teacher' }];

  const [teacherId, setTeacherId] = useState(initialDraft?.teacherId || studioTeachers[0]?.id || '');
  const [teacherName, setTeacherName] = useState(initialDraft?.teacherName || studioTeachers[0]?.displayName || `${studio.name} Staff`);

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
    <div className={`max-w-4xl mx-auto px-4 py-6 ${colorTokens.surfaces.page}`}>
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between pb-4 mb-6 ${colorTokens.borders.dividerBottom}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className={colorTokens.buttons.secondary}
          >
            ← Back
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${colorTokens.text.primary} flex items-center gap-2`}>
              <span>🧘 Class Schedule Creator</span>
            </h1>
            <p className={`text-xs ${colorTokens.text.subtle}`}>
              {studio.name} ({studio.location_prefix}) {studio.parentBrandName ? `• ${studio.parentBrandName}` : ''}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className={`px-3 py-1 text-xs rounded-full ${colorTokens.badges.emerald} font-semibold`}>
            Studio Creator Mode
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className={`mb-6 p-4 rounded-xl ${colorTokens.surfaces.roseNotice} text-sm flex items-center justify-between`}>
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 dark:text-red-400 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Main Form Sections Container */}
      <div className="space-y-6">

        {/* Section 1: Basic Class Information */}
        <div className={`${colorTokens.surfaces.card} p-6 space-y-4`}>
          <h2 className={`text-lg font-semibold ${colorTokens.text.accentEmerald} flex items-center gap-2`}>
            <span>📝 Class Overview & Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="class-title-input" className={colorTokens.inputs.label}>
                Class Title <span className="text-red-500">*</span>
              </label>
              <input
                id="class-title-input"
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Hot Ashtanga Primary Series"
                className={colorTokens.inputs.base}
              />
            </div>

            <div>
              <label htmlFor="class-style-select" className={colorTokens.inputs.label}>
                Yoga Category / Style
              </label>
              <select
                id="class-style-select"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className={colorTokens.inputs.select}
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
            <label htmlFor="teacher-select" className={colorTokens.inputs.label}>
              Assigned Teacher <span className="text-red-500">*</span>
            </label>
            <select
              id="teacher-select"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={colorTokens.inputs.select}
            >
              {studioTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  🧘 {t.displayName} {t.specialty ? `(${t.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="class-subtitle-input" className={colorTokens.inputs.label}>
              Class Subtitle / Summary
            </label>
            <input
              id="class-subtitle-input"
              type="text"
              value={classTypeDescription}
              onChange={(e) => setClassTypeDescription(e.target.value)}
              placeholder="e.g. Traditional 90-min primary series in 35°C heat."
              className={colorTokens.inputs.base}
            />
          </div>

          <div>
            <label htmlFor="class-description-textarea" className={colorTokens.inputs.label}>
              Full Class Description & Philosophy
            </label>
            <textarea
              id="class-description-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what yogis should expect, posture focus, energy level, and recommendations..."
              className={colorTokens.inputs.base}
            />
          </div>
        </div>

        {/* Section 2: Room Climate & Spec Controls */}
        <div className={`${colorTokens.surfaces.card} p-6 space-y-4`}>
          <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <span>🌡️ Room Climate & Studio Environment</span>
          </h2>

          <div>
            <label className={colorTokens.inputs.label}>
              Room Climate Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setRoomClimate('hot_studio')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'hot_studio'
                    ? colorTokens.badges.rose
                    : colorTokens.tabs.inactivePill
                }`}
              >
                🔥 Hot Studio
              </button>
              <button
                type="button"
                onClick={() => setRoomClimate('heated_room')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'heated_room'
                    ? colorTokens.badges.amber
                    : colorTokens.tabs.inactivePill
                }`}
              >
                🌡️ Heated Room
              </button>
              <button
                type="button"
                onClick={() => setRoomClimate('air_conditioned')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'air_conditioned'
                    ? colorTokens.badges.cyan
                    : colorTokens.tabs.inactivePill
                }`}
              >
                ❄️ Air Conned
              </button>
              <button
                type="button"
                onClick={() => setRoomClimate('natural_ambient')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  roomClimate === 'natural_ambient'
                    ? colorTokens.badges.emerald
                    : colorTokens.tabs.inactivePill
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
                    : colorTokens.tabs.inactivePill
                }`}
              >
                ☀️ Outdoor
              </button>
            </div>
          </div>

          {(roomClimate === 'hot_studio' || roomClimate === 'heated_room') && (
            <div>
              <label className={colorTokens.inputs.label}>
                Target Temperature (°C)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="20"
                  max="45"
                  value={temperatureCelsius}
                  onChange={(e) => setTemperatureCelsius(parseInt(e.target.value, 10) || 35)}
                  className={`w-32 ${colorTokens.inputs.selectAmberFocus}`}
                />
                <span className={`text-sm ${colorTokens.text.accentAmber} font-semibold`}>°C (Celsius)</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className={colorTokens.inputs.label}>
                Duration (Minutes)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className={colorTokens.inputs.select}
              >
                {DURATION_OPTIONS.map((dur) => (
                  <option key={dur} value={dur}>
                    ⏱️ {dur} Minutes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={colorTokens.inputs.label}>
                Max Capacity (Yogis)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 20)}
                className={colorTokens.inputs.base}
              />
            </div>

            <div>
              <label className={colorTokens.inputs.label}>
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className={colorTokens.inputs.select}
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
            <label className={colorTokens.inputs.label}>
              Equipment / What to Bring
            </label>
            <input
              type="text"
              value={equipmentNeeded}
              onChange={(e) => setEquipmentNeeded(e.target.value)}
              placeholder="e.g. Yoga Mat, Large Water Bottle & Sweat Towel"
              className={colorTokens.inputs.base}
            />
          </div>
        </div>

        {/* Section 3: Outlook Calendar Recurrence Engine */}
        <div className={`${colorTokens.surfaces.card} p-6 space-y-4`}>
          <h2 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
            <span>📅 Outlook Calendar Recurrence Engine</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-session-date" className={colorTokens.inputs.label}>
                First Session Date
              </label>
              <input
                id="first-session-date"
                type="date"
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500`}
              />
            </div>

            <div>
              <label htmlFor="start-time-input" className={colorTokens.inputs.label}>
                Start Time
              </label>
              <input
                id="start-time-input"
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 07:30 AM"
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500`}
              />
            </div>
          </div>

          <div>
            <label className={colorTokens.inputs.label}>
              Recurrence Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('none')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'none'
                    ? colorTokens.tabs.activeSlate
                    : colorTokens.tabs.inactivePill
                }`}
              >
                1️⃣ Single Session
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'weekly'
                    ? colorTokens.badges.cyan
                    : colorTokens.tabs.inactivePill
                }`}
              >
                📅 Weekly Recurring
              </button>
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'daily'
                    ? colorTokens.badges.cyan
                    : colorTokens.tabs.inactivePill
                }`}
              >
                ☀️ Daily Recurring
              </button>
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  frequency === 'monthly'
                    ? colorTokens.badges.cyan
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
                Repeat On Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAY_PILLS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleDayPill(day)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
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

          {frequency !== 'none' && (
            <div className="pt-2">
              <label className={colorTokens.inputs.label}>
                Recurrence End Condition
              </label>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 text-sm ${colorTokens.text.secondary} cursor-pointer`}>
                  <input
                    type="radio"
                    name="endCond"
                    checked={endCondition === 'never'}
                    onChange={() => setEndCondition('never')}
                    className="accent-cyan-500"
                  />
                  <span>Never (Ongoing schedule)</span>
                </label>

                <label className={`flex items-center gap-3 text-sm ${colorTokens.text.secondary} cursor-pointer`}>
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
                      className={`w-20 px-3 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500`}
                    />
                  )}
                </label>

                <label className={`flex items-center gap-3 text-sm ${colorTokens.text.secondary} cursor-pointer`}>
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
                      className={`px-3 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500`}
                    />
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Currency Acceptance Policy Selector */}
        <div className={`${colorTokens.surfaces.card} p-6 space-y-4`}>
          <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <span>💳 Class Currency & Pass Acceptance Selector</span>
          </h2>

          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 rounded-xl ${colorTokens.surfaces.inset} cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors`}>
              <input
                type="radio"
                name="currencyPolicy"
                checked={currencyPolicyMode === 'acceptAll'}
                onChange={() => setCurrencyPolicyMode('acceptAll')}
                className="mt-1 accent-purple-500"
              />
              <div>
                <span className={`text-sm font-semibold ${colorTokens.text.primary}`}>Accept All Studio Currencies & Passes</span>
                <p className={`text-xs ${colorTokens.text.muted} mt-1`}>
                  Default mode: Yogis can book this class using any valid credit pack, drop-in rate, or unlimited pass accepted by this studio branch.
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-xl ${colorTokens.surfaces.inset} cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors`}>
              <input
                type="radio"
                name="currencyPolicy"
                checked={currencyPolicyMode === 'customSelected'}
                onChange={() => setCurrencyPolicyMode('customSelected')}
                className="mt-1 accent-purple-500"
              />
              <div>
                <span className={`text-sm font-semibold ${colorTokens.text.primary}`}>Custom Selected Currencies & Passes</span>
                <p className={`text-xs ${colorTokens.text.muted} mt-1`}>
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
                        className={`flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 ${colorTokens.borders.default} text-xs text-slate-800 dark:text-slate-200 cursor-pointer hover:border-purple-500/50`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCurrencyId(curr.id)}
                            className="accent-purple-500"
                          />
                          <span className={`font-semibold ${colorTokens.text.primary}`}>{curr.title}</span>
                          <span className={colorTokens.text.subtle}>
                            ({curr.creditCount ? `${curr.creditCount} Credits` : 'Unlimited'} • {curr.currencySymbol}{curr.basePriceAmount.toFixed(2)})
                          </span>
                        </div>
                        {curr.studioId && (
                          <span className={`px-2 py-0.5 rounded ${colorTokens.badges.purple} text-[10px]`}>
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
        <div className={`bg-white/95 dark:bg-slate-900/90 ${colorTokens.borders.default} rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 backdrop-blur-md`}>
          <button
            type="button"
            onClick={onBack}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl ${colorTokens.buttons.secondaryText} text-sm font-semibold`}
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveDraft}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl ${colorTokens.badges.neutral} text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2`}
            >
              <span>📝 Save Draft</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveTemplate}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl ${colorTokens.badges.amber} hover:bg-amber-200 dark:hover:bg-amber-500/30 text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2`}
            >
              <span>📋 Save as Template</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublishLive}
              className={`w-full sm:w-auto px-6 py-3 ${colorTokens.buttons.primaryGradient} text-sm font-bold`}
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
