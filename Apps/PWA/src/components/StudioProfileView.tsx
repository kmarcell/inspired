import React, { useState } from 'react';
import { YogaStudio, UserProfile, StudioTeacher } from '../types';
import { firestoreService } from '../services/firestoreService';
import { StudioScheduleView } from './StudioScheduleView';
import { StudioMembersView } from './StudioMembersView';
import { CommunityFeedView } from './CommunityFeedView';

interface StudioProfileViewProps {
  studio: YogaStudio;
  currentUser: UserProfile | null;
  onBack: () => void;
  onSelectTeacher?: (teacherId: string) => void;
  onSelectUserProfile?: (userId: string) => void;
  onUpdateCurrentUser?: (updated: UserProfile) => void;
}

export const StudioProfileView: React.FC<StudioProfileViewProps> = ({
  studio,
  currentUser,
  onBack,
  onSelectTeacher,
  onSelectUserProfile,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'feed'>('schedule');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [joining, setJoining] = useState(false);

  const studioCommunityId = `comm_studio_${studio.id}`;
  const [localCommunities, setLocalCommunities] = useState<string[]>(currentUser?.joinedCommunities || []);
  const [membersCount, setMembersCount] = useState<number>(studio.membersCount || 0);

  const isJoined = localCommunities.includes(studioCommunityId);

  // Dynamically calculate actual enrolled members count from subcollection
  React.useEffect(() => {
    let isMounted = true;
    firestoreService.fetchStudioMembers(studio.id).then((membersList) => {
      if (isMounted && membersList && membersList.length > 0) {
        setMembersCount(membersList.length);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [studio.id]);

  // Default Assigned Teachers for seed demonstration if not populated
  const defaultTeachers: StudioTeacher[] = studio.assignedTeachers && studio.assignedTeachers.length > 0
    ? studio.assignedTeachers
    : [
        { id: 'user_maryia', displayName: 'Maryia Sharma', specialty: 'Vinyasa & Yin', isPublic: true },
        { id: 'user_elena', displayName: 'Elena Rostova', specialty: 'Ashtanga Lead', isPublic: true },
        { id: 'user_sarah', displayName: 'Sarah Jenkins', specialty: 'Restorative & Breath', isPublic: true },
      ];

  const handleJoinToggle = async () => {
    if (!currentUser) return;
    setJoining(true);

    try {
      if (isJoined) {
        // Unjoin
        const updatedList = localCommunities.filter((id) => id !== studioCommunityId);
        setLocalCommunities(updatedList);
        setMembersCount((prev) => Math.max(0, prev - 1));
        await firestoreService.updateUserProfile(currentUser.id, { joinedCommunities: updatedList });
        onUpdateCurrentUser?.({ ...currentUser, joinedCommunities: updatedList });
      } else {
        // Single-action cascading join (Joins Studio Branch AND Parent Brand Community)
        const brandCommId = studio.parentBrandCommunityId;
        const updatedList = Array.from(new Set([...localCommunities, studioCommunityId, brandCommId].filter(Boolean) as string[]));
        setLocalCommunities(updatedList);
        setMembersCount((prev) => prev + 1);

        const updatedUser = await firestoreService.joinStudioWithParentBrand(
          studio.id,
          studio.parentBrandCommunityId,
          currentUser
        );
        onUpdateCurrentUser?.(updatedUser);
      }
    } catch (e) {
      console.error('Join/unjoin studio failed:', e);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-16 space-y-6 animate-fadeIn">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition"
        >
          <span>← Back</span>
        </button>
        <h2 className="text-sm font-black text-slate-900 dark:text-white">Studio Profile</h2>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Hero Cover Banner & Logo */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="h-36 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Avatar Overlay */}
        <div className="px-6 pt-0 pb-6 relative">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-indigo-600 flex items-center justify-center text-3xl shadow-lg">
              🧘
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleJoinToggle}
                disabled={joining}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition transform active:scale-95 ${
                  isJoined
                    ? 'bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-indigo-500/30'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-950/40'
                }`}
              >
                {joining ? 'Updating...' : isJoined ? '✓ Joined Studio' : '＋ Join Studio'}
              </button>

              <button
                onClick={() => setShowMembersModal(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
              >
                👥 {membersCount} Members ➔
              </button>
            </div>
          </div>

          {/* Title & Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{studio.name}</h1>
              
              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                studio.status === 'temp_closed'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : studio.status === 'closed'
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}>
                {studio.status === 'temp_closed' ? '⏸️ Temp Closed' : studio.status === 'closed' ? '🔴 Closed' : '🟢 Open'}
              </span>

              {/* Parent Brand or Independent Status Badge */}
              {studio.parentBrandName ? (
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  🏢 {studio.parentBrandName}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  🌴 Independent Studio
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              📍 {studio.address} ({studio.location_prefix})
            </p>

            {studio.about && (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{studio.about}</p>
            )}

            {/* Contact Details */}
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 flex-wrap">
              {studio.contactEmail && (
                <a href={`mailto:${studio.contactEmail}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  ✉️ {studio.contactEmail}
                </a>
              )}
              {studio.contactPhone && (
                <a href={`tel:${studio.contactPhone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  📞 {studio.contactPhone}
                </a>
              )}
              {studio.websiteUrl && (
                <a href={studio.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  🌐 Website ➔
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontally Scrolling Teachers Carousel */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-md transition-colors">
        <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Teachers at this Studio (Swipe ➔)
        </h3>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {defaultTeachers.map((teacher) => (
            <div
              key={teacher.id}
              onClick={() => onSelectTeacher?.(teacher.id)}
              className="flex-shrink-0 snap-start flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 cursor-pointer transition min-w-[170px]"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white">
                {teacher.displayName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 underline truncate">{teacher.displayName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{teacher.specialty || 'Yoga Instructor'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main View Tabs (Schedule vs Community Feed) */}
      <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition ${
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📅 Class Schedule
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition ${
            activeTab === 'feed'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          💬 Studio Community Feed
        </button>
      </div>

      {/* Active Tab Body */}
      {activeTab === 'schedule' ? (
        <StudioScheduleView
          studioId={studio.id}
          studioName={studio.name}
          isJoined={isJoined}
          currentUser={currentUser}
          onSelectTeacher={onSelectTeacher}
          onRequestJoin={handleJoinToggle}
        />
      ) : !isJoined ? (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl transition-colors">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-3xl font-bold shadow-md">
            🔒
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Members-Only Studio Feed</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Join <span className="text-indigo-600 dark:text-indigo-400 font-bold">{studio.name}</span> to view member announcements, teacher updates, and private community discussions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleJoinToggle}
            disabled={joining}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-950/50 transition transform active:scale-95 disabled:opacity-50"
          >
            {joining ? 'Updating...' : '＋ Join Studio to Unlock Feed'}
          </button>
        </div>
      ) : (
        <CommunityFeedView
          filterArea={`comm_studio_${studio.id}`}
          hideHeader
        />
      )}

      {/* Studio Members Subpage Modal */}
      {showMembersModal && (
        <StudioMembersView
          studioId={studio.id}
          studioName={studio.name}
          isJoined={isJoined}
          onClose={() => setShowMembersModal(false)}
          onSelectMemberProfile={onSelectUserProfile}
        />
      )}
    </div>
  );
};
