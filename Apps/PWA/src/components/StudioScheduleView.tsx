import React, { useState, useEffect } from 'react';
import { StudioClass, UserProfile } from '../types';
import { firestoreService } from '../services/firestoreService';
import { ClassInfoModal } from './ClassInfoModal';

interface StudioScheduleViewProps {
  studioId: string;
  studioName?: string;
  isJoined?: boolean;
  currentUser: UserProfile | null;
  onSelectTeacher?: (teacherId: string) => void;
  onRequestJoin?: () => void;
}

export const StudioScheduleView: React.FC<StudioScheduleViewProps> = ({
  studioId,
  studioName,
  isJoined = true,
  currentUser,
  onSelectTeacher,
  onRequestJoin,
}) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoModalClass, setInfoModalClass] = useState<StudioClass | null>(null);
  const [userBookings, setUserBookings] = useState<Record<string, 'confirmed' | 'waitlisted'>>({});
  const [cancelingClassId, setCancelingClassId] = useState<string | null>(null);
  const [showJoinPromptModal, setShowJoinPromptModal] = useState(false);

  // Generate 7 days for the active week offset
  const getDaysOfWeek = (offset: number) => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + offset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getDaysOfWeek(currentWeekOffset);
  const activeDate = weekDays[selectedDateIndex] || weekDays[0];
  const activeDateString = activeDate.toISOString().split('T')[0];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    firestoreService.fetchStudioClasses(studioId, activeDateString).then((cls) => {
      if (isMounted) {
        setClasses(cls);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [studioId, activeDateString]);

  const handleBook = async (cls: StudioClass) => {
    if (!currentUser) return;

    if (!isJoined) {
      setShowJoinPromptModal(true);
      return;
    }

    try {
      const res = await firestoreService.bookStudioClass(studioId, cls.id, currentUser);
      setUserBookings((prev) => ({ ...prev, [cls.id]: res.status }));

      // Refresh class capacity in local state
      setClasses((prev) =>
        prev.map((item) => {
          if (item.id === cls.id) {
            if (res.status === 'confirmed') {
              return { ...item, bookedCount: item.bookedCount + 1 };
            } else {
              return { ...item, waitlist: [...item.waitlist, currentUser.id] };
            }
          }
          return item;
        })
      );
    } catch (e) {
      console.error('Booking failed:', e);
    }
  };

  const handleCancelBooking = async (clsId: string) => {
    if (!currentUser) return;
    setCancelingClassId(clsId);

    try {
      await firestoreService.cancelStudioBooking(studioId, clsId, currentUser.id);
      setUserBookings((prev) => {
        const next = { ...prev };
        delete next[clsId];
        return next;
      });

      setClasses((prev) =>
        prev.map((item) => {
          if (item.id === clsId) {
            return {
              ...item,
              bookedCount: Math.max(0, item.bookedCount - 1),
              waitlist: item.waitlist.filter((id) => id !== currentUser.id),
            };
          }
          return item;
        })
      );
    } finally {
      setCancelingClassId(null);
    }
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[start.getMonth()]} ${start.getDate()} – ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  };

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="w-full space-y-6">
      {/* Week Switcher Header */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <button
          onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
          className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          aria-label="Previous week"
        >
          ◀ Prev Week
        </button>

        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatWeekRange()}</span>

        <button
          onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
          className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          aria-label="Next week"
        >
          Next Week ▶
        </button>
      </div>

      {/* 7-Day Selector Pills */}
      <div className="grid grid-cols-7 gap-1.5 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {weekDays.map((d, index) => {
          const isSelected = selectedDateIndex === index;
          const isToday = d.toDateString() === new Date().toDateString();

          return (
            <button
              key={index}
              onClick={() => setSelectedDateIndex(index)}
              className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider">{dayNames[index]}</span>
              <span className="text-sm font-black mt-0.5">{d.getDate()}</span>
              {isToday && (
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-600 dark:bg-indigo-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Class Schedule List for Active Day */}
      <div className="space-y-3 min-h-[300px] transition-all duration-200">
        <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Classes for {activeDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h4>

        <div className={`space-y-3 transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {classes.length === 0 && !loading ? (
            <div className="p-8 text-center rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 min-h-[240px] flex flex-col items-center justify-center">
              <p className="text-2xl">🧘‍♀️</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No classes scheduled for this day</p>
              <p className="text-[11px] text-slate-500">Check another day in the calendar switcher above.</p>
            </div>
          ) : classes.length === 0 && loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
          classes.map((cls) => {
            const bookingStatus = userBookings[cls.id];
            const isBooked = bookingStatus === 'confirmed';
            const isWaitlisted = bookingStatus === 'waitlisted' || cls.waitlist.includes(currentUser?.id || '');
            const openSlots = cls.capacity - cls.bookedCount;
            const isFull = openSlots <= 0;

            return (
              <div
                key={cls.id}
                className={`flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-sm ${
                  isBooked ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left Info Column */}
                <div className="space-y-1 pr-3">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{cls.startTime} – {cls.endTime}</p>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white">{cls.className}</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    w/{' '}
                    <button
                      type="button"
                      onClick={() => onSelectTeacher?.(cls.teacherId)}
                      className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500 dark:hover:text-indigo-300 transition"
                    >
                      {cls.teacherName}
                    </button>
                  </p>
                </div>

                {/* Right Action Column */}
                <div className="flex items-center gap-2">
                  {/* Info Modal Button (ⓘ) */}
                  <button
                    type="button"
                    onClick={() => setInfoModalClass(cls)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-white transition shrink-0 shadow-sm"
                    title="Class Details"
                    aria-label="View class details"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  {/* Book / Waitlist Button */}
                  {isBooked ? (
                    <button
                      onClick={() => handleCancelBooking(cls.id)}
                      disabled={cancelingClassId === cls.id}
                      className="flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-red-600 text-white font-bold transition text-xs shadow-md shadow-emerald-950/40"
                    >
                      <span>✓ Booked</span>
                      <span className="text-[9px] font-normal opacity-90">Tap to cancel</span>
                    </button>
                  ) : isWaitlisted ? (
                    <button
                      onClick={() => handleCancelBooking(cls.id)}
                      disabled={cancelingClassId === cls.id}
                      className="flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-amber-600 hover:bg-red-600 text-white font-bold transition text-xs shadow-md shadow-amber-950/40"
                    >
                      <span># Waitlisted</span>
                      <span className="text-[9px] font-normal opacity-90">Tap to leave</span>
                    </button>
                  ) : !isJoined ? (
                    <button
                      type="button"
                      onClick={() => handleBook(cls)}
                      className="flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 font-bold transition text-xs shadow-sm group"
                      title="Join Studio to Book or Waitlist"
                    >
                      <span className="flex items-center space-x-1">
                        <span>🔒</span>
                        <span>{isFull ? 'Waitlist' : 'Book'}</span>
                      </span>
                      <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        Join to {isFull ? 'Waitlist' : 'Book'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBook(cls)}
                      className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl text-white font-bold transition text-xs shadow-md ${
                        isFull
                          ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/40'
                          : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/40'
                      }`}
                    >
                      <span>{isFull ? 'Waitlist' : 'Book'}</span>
                      <span className={`text-[9px] font-normal ${isFull ? 'text-amber-200' : 'text-emerald-200'}`}>
                        {isFull ? 'Waitlist open' : `${openSlots} of ${cls.capacity} open`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Pop-up Class Info Modal */}
      <ClassInfoModal
        selectedClass={infoModalClass}
        isJoined={isJoined}
        onClose={() => setInfoModalClass(null)}
        onBook={handleBook}
        onSelectTeacher={onSelectTeacher}
      />

      {/* Join Studio Prompt Modal when attempting to book unjoined */}
      {showJoinPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-3xl font-bold shadow-md">
              🧘‍♀️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Join Studio to Book</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                You must join <span className="font-bold text-indigo-600 dark:text-indigo-400">{studioName || 'this studio'}</span> before reserving classes or joining waitlists.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowJoinPromptModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowJoinPromptModal(false);
                  onRequestJoin?.();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition active:scale-95"
              >
                Join Studio ＋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
