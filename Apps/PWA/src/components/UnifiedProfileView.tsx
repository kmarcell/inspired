import React, { useState } from 'react';
import { UserProfile, StudioClass, Post } from '../types';
import { TeacherScheduleModal, TeachingStudioSummary } from './TeacherScheduleModal';
import { formatLocationBadge } from '../utils/locationFormatter';

export type ProfileVariant = 'user' | 'area' | 'brand' | 'studio';

export interface UnifiedProfileData {
  id: string;
  variant: ProfileVariant;
  name: string;
  username?: string;
  bio?: string;
  location_prefix?: string;
  bannerImageUrl?: string;
  avatarUrl?: string;
  emblemEmoji?: string;
  isTeacher?: boolean;
  isVerified?: boolean;
  isProfilePublic?: boolean;
  subscriberCount: number;
  postCount: number;
  teachingStudios?: TeachingStudioSummary[];
  studioBranches?: {
    id: string;
    name: string;
    address: string;
    location_prefix: string;
    status: 'open' | 'closed';
  }[];
  areaTeachers?: {
    id: string;
    name: string;
    specialty: string;
  }[];
  classes?: StudioClass[];
  posts?: Post[];
}

interface UnifiedProfileViewProps {
  profileData: UnifiedProfileData;
  currentUser: UserProfile | null;
  onBack?: () => void;
  onSelectStudio?: (studioId: string) => void;
  onSelectUser?: (userId: string) => void;
  onToggleSubscription?: (profileId: string) => Promise<void>;
}

export const UnifiedProfileView: React.FC<UnifiedProfileViewProps> = ({
  profileData,
  currentUser,
  onBack,
  onSelectStudio,
  onSelectUser,
  onToggleSubscription,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'studios_classes' | 'about' | 'members'>('feed');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(
    currentUser?.joinedCommunities?.includes(profileData.id) ?? false
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  React.useEffect(() => {
    setIsSubscribed(currentUser?.joinedCommunities?.includes(profileData.id) ?? false);
    setIsMenuOpen(false);
    setActiveTab('feed');
  }, [profileData.id, currentUser?.joinedCommunities]);

  const isUserPrivate =
    profileData.variant === 'user' &&
    profileData.isProfilePublic === false &&
    currentUser?.id !== profileData.id &&
    !isSubscribed;

  const handleActionClick = async () => {
    setLoadingAction(true);
    try {
      if (onToggleSubscription) {
        await onToggleSubscription(profileData.id);
      }
      setIsSubscribed(!isSubscribed);
    } finally {
      setLoadingAction(false);
    }
  };

  // Format location badge using standard combo (e.g. 📍 W12 (Askew))
  const renderLocationBadge = () => {
    return formatLocationBadge(profileData.location_prefix, profileData.name);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col max-w-2xl mx-auto w-full transition-colors">
      {/* Top Header Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 transition"
          >
            ← Back
          </button>
        ) : (
          <div className="w-12" />
        )}
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
          {profileData.name}
        </h2>
        <div className="w-12" />
      </div>

      {/* Hero Cover Banner */}
      <div
        className={`relative w-full h-32 sm:h-40 bg-gradient-to-r ${
          profileData.variant === 'area'
            ? 'from-emerald-900 via-teal-900 to-indigo-900'
            : profileData.variant === 'brand'
            ? 'from-indigo-900 via-purple-900 to-pink-900'
            : 'from-purple-900 via-indigo-900 to-slate-900'
        }`}
      >
        {profileData.bannerImageUrl && (
          <img
            src={profileData.bannerImageUrl}
            alt="Cover Banner"
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-slate-950/20" />
      </div>

      {/* Main Profile Info Header (with overlapping Avatar) */}
      <div className="px-6 relative -mt-10 sm:-mt-12 space-y-4">
        {/* Profile Avatar Badge */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white dark:bg-slate-950 p-1 shadow-2xl ring-2 ring-white dark:ring-slate-950">
          {profileData.avatarUrl ? (
            <img
              src={profileData.avatarUrl}
              alt={profileData.name}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            <div
              className={`w-full h-full rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-md ${
                profileData.variant === 'area'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                  : profileData.variant === 'brand'
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-500'
                  : 'bg-gradient-to-tr from-purple-600 to-pink-500'
              }`}
            >
              {profileData.emblemEmoji || (profileData.variant === 'user' ? '🧘‍♀️' : profileData.variant === 'brand' ? '🏢' : '👥')}
            </div>
          )}
        </div>
        {/* Title & Verified Badge Row */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {profileData.name}
            </h1>
            {profileData.isVerified && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                ✓
              </span>
            )}
          </div>

          {/* Sub-Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {profileData.username && (
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">@{profileData.username}</span>
            )}

            {renderLocationBadge() && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                {renderLocationBadge()}
              </span>
            )}

            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20 text-[10px] font-bold">
              {profileData.variant === 'user'
                ? profileData.isTeacher
                  ? '🧘 Teacher'
                  : '🧘 Yogi'
                : profileData.variant === 'brand'
                ? '🏢 Brand Network (Top Level)'
                : '👥 Area Community'}
            </span>
          </div>
        </div>

        {/* Bio Statement */}
        {profileData.bio && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{profileData.bio}</p>
        )}

        {/* Clean 2-Item Metrics Bar */}
        <div className="grid grid-cols-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-center shadow-sm">
          <div className="border-r border-slate-200 dark:border-slate-800">
            <div className="text-base font-black text-slate-900 dark:text-white">{profileData.subscriberCount}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              {profileData.variant === 'user' ? 'SUBSCRIBERS' : 'MEMBERS'}
            </div>
          </div>
          <div>
            <div className="text-base font-black text-slate-900 dark:text-white">{profileData.postCount}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">POSTS</div>
          </div>
        </div>

        {/* Main Action Bar */}
        {!isSubscribed ? (
          <button
            onClick={handleActionClick}
            disabled={loadingAction}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            {loadingAction ? 'Updating...' : profileData.variant === 'user' ? 'Subscribe' : 'Join Community'}
          </button>
        ) : (
          <div className="relative flex items-center gap-2">
            {/* Unactionable Status Badge */}
            <div
              data-testid="joined-status-badge"
              className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2 cursor-default select-none shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {profileData.variant === 'user' ? '✓ Subscribed' : '✓ Joined Community'}
            </div>

            {/* Ellipsis Menu Trigger Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="profile-menu-trigger"
              aria-label="Community Options"
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {/* Ellipsis Options Dropdown Menu */}
            {isMenuOpen && (
              <>
                {/* Tapaway Backdrop Close Handler */}
                <div
                  className="fixed inset-0 z-40 bg-black/10"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="profile-menu-backdrop"
                />

                <div className="absolute right-0 top-14 z-50 w-48 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await handleActionClick();
                    }}
                    disabled={loadingAction}
                    data-testid="leave-community-btn"
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-2"
                  >
                    <span>🚪</span>
                    {loadingAction
                      ? 'Leaving...'
                      : profileData.variant === 'user'
                      ? 'Unsubscribe'
                      : 'Leave Community'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Privacy Guardrail check for private user profiles */}
      {isUserPrivate ? (
        <div className="mx-6 my-8 p-8 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 shadow-md">
          <div className="text-3xl">🔒</div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">This Yogi's Profile is Private</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Subscribe to view {profileData.name}'s posts, bio details, and community activity.
          </p>
        </div>
      ) : (
        <>
          {/* Canonical Sub-Tab Switcher */}
          <div className="px-6 mt-4 mb-4">
            <div className="flex bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl border border-slate-300 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'feed'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                💬 Feed
              </button>

              <button
                onClick={() => setActiveTab('studios_classes')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'studios_classes'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {profileData.variant === 'brand'
                  ? '🏢 Studios'
                  : profileData.variant === 'area'
                  ? '🧘 Studios & Teachers'
                  : '🧘 Classes'}
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'about'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                ℹ️ About
              </button>
            </div>
          </div>

          {/* Sub-Tab Content View */}
          <div className="p-6 flex-1 space-y-4">
            {activeTab === 'feed' && (
              <div className="space-y-4">
                {!isSubscribed ? (
                  <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl transition-colors">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-3xl font-bold shadow-md">
                      🔒
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Members-Only Community Feed</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                        Join <span className="text-indigo-600 dark:text-indigo-400 font-bold">{profileData.name}</span> to view community updates, member discussions, and local class announcements.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleActionClick}
                      disabled={loadingAction}
                      className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/40 transition transform active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {loadingAction
                        ? 'Updating...'
                        : profileData.variant === 'user'
                        ? '＋ Subscribe to Unlock Feed'
                        : '＋ Join Community to Unlock Feed'}
                    </button>
                  </div>
                ) : profileData.posts && profileData.posts.length > 0 ? (
                  profileData.posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => onSelectUser?.(post.author.id)}
                          className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-sm hover:scale-105 transition"
                        >
                          🧘‍♀️
                        </div>
                        <div>
                          <div
                            onClick={() => onSelectUser?.(post.author.id)}
                            className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          >
                            {post.author.username}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{post.createdAt}</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{post.content}</p>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="text-pink-500 dark:text-pink-400">❤️ {post.stats.likeCount} Likes</span>
                        <span>💬 {post.stats.commentCount} Comments</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    No community posts published yet. Be the first to share a post!
                  </div>
                )}
              </div>
            )}

            {activeTab === 'studios_classes' && (
              <div className="space-y-4">
                {/* Variant 1: Teacher Classes (Capped to Next 7 Days) */}
                {profileData.variant === 'user' && profileData.isTeacher && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Classes in the Next 7 Days
                    </h4>

                    {profileData.classes && profileData.classes.length > 0 ? (
                      profileData.classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-md"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span>
                              {cls.startTime} – {cls.endTime}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px]">
                              🔥 Hot Studio
                            </span>
                          </div>
                          <h5 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{cls.title}</h5>
                          <p
                            onClick={() => onSelectStudio?.(cls.studioId)}
                            className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold cursor-pointer hover:underline"
                          >
                            🏢 {cls.studioName}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs shadow-sm">
                        No classes scheduled in the next 7 days.
                      </div>
                    )}

                    {/* Bottom CTA to open full interactive schedule modal */}
                    <button
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="w-full py-3 bg-white dark:bg-slate-900 border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>📅</span> Schedule ➔
                    </button>
                  </div>
                )}

                {/* Variant 2: Brand Community Studio Branches */}
                {profileData.variant === 'brand' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Studio Branches in this Network ({profileData.studioBranches?.length || 0})
                    </h4>

                    {profileData.studioBranches?.map((st) => (
                      <div
                        key={st.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-500/40 transition shadow-md"
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">{st.name}</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            📍 {st.address} ({st.location_prefix})
                          </p>
                        </div>
                        <button
                          onClick={() => onSelectStudio?.(st.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          View Studio ➔
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Variant 3: Area Community Studios & Teachers */}
                {profileData.variant === 'area' && (
                  <div className="space-y-6">
                    {/* Local Studios Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Local Studios in this Area ({profileData.studioBranches?.length || 0})
                      </h4>

                      {profileData.studioBranches && profileData.studioBranches.length > 0 ? (
                        profileData.studioBranches.map((st) => (
                          <div
                            key={st.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-500/40 transition shadow-md"
                          >
                            <div>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{st.name}</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                📍 {st.address} ({st.location_prefix})
                              </p>
                            </div>
                            <button
                              onClick={() => onSelectStudio?.(st.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              View Studio ➔
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs shadow-sm">
                          No local studios listed yet in this area.
                        </div>
                      )}
                    </div>

                    {/* Area Teachers Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Teachers in this Area ({profileData.areaTeachers?.length || 0})
                      </h4>

                      {profileData.areaTeachers && profileData.areaTeachers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {profileData.areaTeachers.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => onSelectUser?.(t.id)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition shadow-md"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                                {t.name.charAt(0)}
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="text-xs font-extrabold text-slate-900 dark:text-white truncate hover:underline hover:text-indigo-600 dark:hover:text-indigo-400">
                                  {t.name}
                                </h5>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  🧘 {t.specialty}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs shadow-sm">
                          No teachers listed yet in this area.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  About &amp; Info
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {profileData.bio || 'No detailed description available.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Interactive Teacher Schedule Calendar Modal */}
      {profileData.variant === 'user' && profileData.isTeacher && (
        <TeacherScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          teacherName={profileData.name}
          teacherUsername={profileData.username || profileData.id}
          teachingStudios={profileData.teachingStudios || []}
          classes={profileData.classes || []}
        />
      )}
    </div>
  );
};
