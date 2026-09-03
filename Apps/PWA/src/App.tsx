import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginView } from './components/LoginView';
import { OnboardingView } from './components/OnboardingView';
import { CommunityFeedView } from './components/CommunityFeedView';
import { JoinedCommunitiesView } from './components/JoinedCommunitiesView';
import { ProfileView } from './components/ProfileView';
import { SearchView } from './components/SearchView';
import { MyStudiosView } from './components/MyStudiosView';
import { AdminClaimsView } from './components/AdminClaimsView';
import { ClaimStudioView } from './components/ClaimStudioView';
import { StudioProfileView } from './components/StudioProfileView';
import { UnifiedProfileView } from './components/UnifiedProfileView';
import { firestoreService } from './services/firestoreService';
import { YogaStudio } from './types';

const MainRouter: React.FC = () => {
  const { status, user, logout, refreshUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'search' | 'profile' | 'studios' | 'admin'>('feed');
  const [previousTab, setPreviousTab] = useState<'feed' | 'profile'>('feed');
  const [claimingStudioId, setClaimingStudioId] = useState<string | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<YogaStudio | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<any | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Array<{ type: 'profile' | 'studio'; data: any }>>([]);

  const navigateTab = (tab: 'feed' | 'communities' | 'search' | 'profile' | 'studios' | 'admin') => {
    setSelectedStudio(null);
    setClaimingStudioId(null);
    setSelectedProfileData(null);
    setNavigationHistory([]);
    setActiveTab(tab);
  };

  const handleBackNavigation = () => {
    if (navigationHistory.length > 0) {
      const last = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((prev) => prev.slice(0, -1));
      if (last.type === 'profile') {
        setSelectedProfileData(last.data);
        setSelectedStudio(null);
      } else {
        setSelectedStudio(last.data);
        setSelectedProfileData(null);
      }
    } else {
      setSelectedProfileData(null);
      setSelectedStudio(null);
    }
  };

  const handleToggleSubscription = async (targetId: string) => {
    if (!user) return;
    const currentJoined = user.joinedCommunities || [];
    const isAlreadyJoined = currentJoined.includes(targetId);
    const updated = isAlreadyJoined
      ? currentJoined.filter((id) => id !== targetId)
      : [...currentJoined, targetId];

    await firestoreService.updateUserCommunities(user.id, updated);
    await refreshUserProfile();
  };

  const handleOpenCommunityProfile = async (communityId: string) => {
    try {
      if (selectedProfileData) {
        setNavigationHistory((prev) => [...prev, { type: 'profile', data: selectedProfileData }]);
      } else if (selectedStudio) {
        setNavigationHistory((prev) => [...prev, { type: 'studio', data: selectedStudio }]);
      }

      const comm = await firestoreService.fetchCommunityById(communityId);
      if (comm) {
        const isBrand = comm.id.includes('brand') || comm.communityType === 'brand';
        
        // Dynamically fetch and filter studio branches matching this community's location prefix or network
        const allStudios = await firestoreService.fetchStudiosByLocation(comm.location_prefix || '');
        const targetPrefix = (comm.location_prefix || '').trim();

        const matchingBranches = allStudios
          .filter((st) =>
            isBrand
              ? st.parentBrandCommunityId === comm.id || st.location_prefix === targetPrefix
              : st.location_prefix === targetPrefix || (st.location_prefix && comm.id.includes(st.location_prefix.toLowerCase()))
          )
          .map((st) => ({
            id: st.id,
            name: st.name,
            address: st.address,
            location_prefix: st.location_prefix,
            status: st.status === 'active' ? ('open' as const) : ('closed' as const),
          }));

        // Dynamically extract area teachers from matching studio branches
        const areaTeachers: { id: string; name: string; specialty: string }[] = [];
        const seenTeacherIds = new Set<string>();

        for (const branch of matchingBranches) {
          const fullStudio = await firestoreService.fetchStudioById(branch.id);
          if (fullStudio && fullStudio.assignedTeachers) {
            fullStudio.assignedTeachers.forEach((t) => {
              if (!seenTeacherIds.has(t.id)) {
                seenTeacherIds.add(t.id);
                areaTeachers.push({
                  id: t.id,
                  name: t.displayName,
                  specialty: t.specialty || 'Yoga Instructor',
                });
              }
            });
          }
        }

        const feedPosts = await firestoreService.fetchCommunityFeed(comm.id);

        setSelectedProfileData({
          id: comm.id,
          variant: isBrand ? 'brand' : 'area',
          name: comm.name,
          bio: comm.description,
          location_prefix: comm.location_prefix,
          subscriberCount: comm.memberCount || matchingBranches.reduce((acc) => acc + 48, 0) || matchingBranches.length * 48 || 0,
          postCount: feedPosts.length,
          posts: feedPosts,
          studioBranches: matchingBranches,
          areaTeachers,
        });
      }
    } catch (err) {
      console.error('[App] Failed to load community profile:', err);
    }
  };

  const handleOpenUserProfile = async (userId: string) => {
    try {
      if (selectedProfileData) {
        setNavigationHistory((prev) => [...prev, { type: 'profile', data: selectedProfileData }]);
      } else if (selectedStudio) {
        setNavigationHistory((prev) => [...prev, { type: 'studio', data: selectedStudio }]);
      }
      setSelectedStudio(null);

      const userDoc = await firestoreService.fetchUserProfile(userId);
      const userPosts = await firestoreService.fetchUserPosts(userId);

      // Dynamically query studios where this user is an assigned teacher or owner
      const allStudios = await firestoreService.fetchStudiosByLocation('');
      const teachingStudios: { id: string; name: string; location_prefix: string }[] = [];
      const teacherClasses: any[] = [];

      for (const st of allStudios) {
        const fullSt = await firestoreService.fetchStudioById(st.id);
        if (fullSt) {
          const isAssigned = fullSt.assignedTeachers?.some((t) => t.id === userId);
          if (isAssigned || fullSt.ownerId === userId) {
            teachingStudios.push({
              id: fullSt.id,
              name: fullSt.name,
              location_prefix: fullSt.location_prefix,
            });

            const stClasses = await firestoreService.fetchStudioClasses(fullSt.id);
            const myClasses = stClasses.filter((c) => c.teacherId === userId);
            teacherClasses.push(...myClasses);
          }
        }
      }

      const isTeacher =
        teachingStudios.length > 0 ||
        userId === 'user_elena' ||
        userId === 'user_maryia' ||
        userId === 'user_teacher_001' ||
        userId === 'user_david_kim' ||
        userId === 'user_sophia_vane';

      setSelectedProfileData({
        id: userId,
        variant: 'user',
        name:
          userDoc?.displayName ||
          (userId === 'user_elena'
            ? 'Elena Rostova'
            : userId === 'user_maryia'
            ? 'Maryia Sharma'
            : userId === 'user_sarah'
            ? 'Sarah Jenkins'
            : userId === 'user_sophia_vane'
            ? 'Sophia Vane'
            : userId === 'user_david_kim'
            ? 'David Kim'
            : 'Test Yogi'),
        username: userDoc?.username || userId,
        bio:
          userDoc?.bio ||
          (isTeacher
            ? 'Passionate Yoga Instructor in London.'
            : 'Passionate yogi exploring mindfulness and community classes in London.'),
        location_prefix: userDoc?.location_prefix || userDoc?.lastSearchArea || 'W12',
        isTeacher,
        isVerified: true,
        isProfilePublic:
          userDoc?.privacySettings?.isProfilePublic ??
          (userId === 'user_members_only' || userId === 'user_groups_only' ? false : true),
        subscriberCount: isTeacher ? (userDoc?.subscriberCount || 142) : 0,
        postCount: userPosts.length,
        posts: userPosts,
        teachingStudios: isTeacher ? teachingStudios : undefined,
        classes: isTeacher ? teacherClasses : undefined,
      });
    } catch (err) {
      console.error('[App] Failed to load user profile:', err);
    }
  };

  const handleOpenStudio = async (studioId: string) => {
    try {
      if (selectedProfileData) {
        setNavigationHistory((prev) => [...prev, { type: 'profile', data: selectedProfileData }]);
      } else if (selectedStudio) {
        setNavigationHistory((prev) => [...prev, { type: 'studio', data: selectedStudio }]);
      }
      const st = await firestoreService.fetchStudioById(studioId);
      if (st) {
        setSelectedProfileData(null);
        setSelectedStudio(st);
      }
    } catch (err) {
      console.error('[App] Failed to load studio profile:', err);
    }
  };

  if (status === 'launching') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-indigo-500/30 animate-pulse mb-6">
          I
        </div>
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono text-slate-500 dark:text-slate-400">Loading Inspired...</p>
      </div>
    );
  }

  if (status === 'login') {
    return <LoginView />;
  }

  if (status === 'onboarding') {
    return <OnboardingView />;
  }

  const initialLetter = (user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors flex flex-col md:flex-row">
      {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 transition-colors select-none">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-indigo-500/25">
              I
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                Inspired
              </h1>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">@{user?.username || 'user'}</p>
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => navigateTab('feed')}
            data-testid="desktop-tab-feed"
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 border focus:outline-none select-none ${
              activeTab === 'feed' && !selectedStudio && !claimingStudioId
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">🧘‍♀️</span>
            <span>Community Feed</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('search')}
            data-testid="desktop-tab-search"
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 border focus:outline-none select-none ${
              activeTab === 'search' && !selectedStudio && !claimingStudioId
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">🔍</span>
            <span>Search &amp; Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('communities')}
            data-testid="desktop-tab-communities"
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 border focus:outline-none select-none ${
              activeTab === 'communities' && !selectedStudio && !claimingStudioId
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">👥</span>
            <span>My Communities</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('profile')}
            data-testid="desktop-tab-profile"
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 border focus:outline-none select-none ${
              activeTab === 'profile' && !selectedStudio && !claimingStudioId
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">👤</span>
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPreviousTab('feed');
              navigateTab('studios');
            }}
            data-testid="desktop-tab-studios"
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 border focus:outline-none select-none ${
              activeTab === 'studios' && !selectedStudio && !claimingStudioId
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">🏢</span>
            <span>My Studios</span>
          </button>
        </nav>

        {/* User Info & Logout Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          <button
            type="button"
            onClick={() => navigateTab('profile')}
            className="w-full text-left p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 text-xs transition-colors"
          >
            <p className="text-slate-500 dark:text-slate-400 font-medium">Logged in as</p>
            <p className="text-slate-900 dark:text-slate-200 font-bold font-mono truncate">{user?.displayName || user?.username}</p>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* Mobile Header (Following 5.2_LandingPageShell.svg & Apple HIG Guidelines) */}
        <header className="md:hidden shrink-0 sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/80 px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between space-x-2.5 transition-all shadow-sm">
          {/* Left: Avatar / Handle Button (Navigates to Profile) */}
          <button
            type="button"
            onClick={() => navigateTab('profile')}
            data-testid="header-profile-button"
            className="flex items-center space-x-2 shrink-0 hover:opacity-80 transition-all active:scale-95"
            title="My Profile"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-extrabold text-white shadow-md text-sm ring-2 ring-indigo-500/20">
              {initialLetter}
            </div>
          </button>

          {/* Center: Search Bar Entry Button per Mockup 5.2 (Navigates to Search) */}
          <button
            type="button"
            onClick={() => navigateTab('search')}
            data-testid="header-search-bar"
            className="flex-1 flex items-center space-x-2 px-3.5 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500 hover:border-indigo-500/50 transition-all truncate shadow-inner"
          >
            <span className="text-sm">🔍</span>
            <span className="truncate font-medium">Search areas...</span>
          </button>

          {/* Right: Neutral JC Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => navigateTab('communities')}
              data-testid="header-jc-button"
              className="w-10 h-10 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-base flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="My Communities"
            >
              👥
            </button>
          </div>
        </header>

        {/* Active Tab View */}
        <main className="flex-1 pb-12">
          {selectedProfileData ? (
            <UnifiedProfileView
              profileData={selectedProfileData}
              currentUser={user}
              onBack={handleBackNavigation}
              onSelectUser={(userId) => handleOpenUserProfile(userId)}
              onToggleSubscription={handleToggleSubscription}
              onSelectStudio={(studioId) => handleOpenStudio(studioId)}
            />
          ) : selectedStudio ? (
            <StudioProfileView
              studio={selectedStudio}
              currentUser={user}
              onBack={handleBackNavigation}
              onUpdateCurrentUser={() => refreshUserProfile()}
              onSelectTeacher={(userId) => handleOpenUserProfile(userId)}
              onSelectUserProfile={(userId) => handleOpenUserProfile(userId)}
            />
          ) : claimingStudioId ? (
            <ClaimStudioView
              studioId={claimingStudioId}
              onClose={() => setClaimingStudioId(null)}
              onSuccess={() => {
                setClaimingStudioId(null);
                setActiveTab('studios');
              }}
            />
          ) : (
            <>
              {activeTab === 'feed' && (
                <CommunityFeedView onSelectUser={(userId) => handleOpenUserProfile(userId)} />
              )}
              {activeTab === 'search' && (
                <SearchView
                  onClose={() => navigateTab('feed')}
                  onClaimStudio={(id) => setClaimingStudioId(id)}
                  onSelectStudio={(st) => setSelectedStudio(st)}
                  onSelectCommunity={(id) => handleOpenCommunityProfile(id)}
                />
              )}
              {activeTab === 'communities' && (
                <JoinedCommunitiesView
                  onBack={() => navigateTab('feed')}
                  onSelectStudio={(st) => setSelectedStudio(st)}
                  onSelectCommunity={(id) => handleOpenCommunityProfile(id)}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileView
                  onBack={() => navigateTab('feed')}
                  onNavigateToStudios={() => {
                    setPreviousTab('profile');
                    navigateTab('studios');
                  }}
                  onNavigateToAdmin={() => navigateTab('admin')}
                />
              )}
              {activeTab === 'studios' && (
                <MyStudiosView
                  onBack={() => navigateTab(previousTab)}
                  backLabel={previousTab === 'profile' ? 'Back to Profile' : 'Back to Feed'}
                />
              )}
              {activeTab === 'admin' && <AdminClaimsView onBack={() => navigateTab('feed')} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
