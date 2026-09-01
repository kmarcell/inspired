import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Community, YogaStudio } from '../types';

interface JoinedCommunitiesViewProps {
  onBack?: () => void;
  onSelectStudio?: (studio: YogaStudio) => void;
}

export const JoinedCommunitiesView: React.FC<JoinedCommunitiesViewProps> = ({ onBack, onSelectStudio }) => {
  const { user, refreshUserProfile } = useAuth();

  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStudioId, setLoadingStudioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeMenuCommunityId, setActiveMenuCommunityId] = useState<string | null>(null);

  // Close ellipsis menu when clicking anywhere outside
  useEffect(() => {
    if (!activeMenuCommunityId) return;

    const handleClickOutside = () => {
      setActiveMenuCommunityId(null);
    };

    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenuCommunityId]);

  useEffect(() => {
    const loadCommunitiesData = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);

      try {
        const communityIds = user.joinedCommunities || [];
        if (communityIds.length > 0) {
          const fetchedJoined = await firestoreService.fetchCommunitiesByIds(communityIds);
          setJoinedCommunities(fetchedJoined || []);
        } else {
          setJoinedCommunities([]);
        }

        // Fetch suggested communities for recommendations
        const area = user.lastSearchArea || 'Askew';
        const suggestions = (await firestoreService.fetchSuggestedCommunities(area)) || [];
        // Exclude already joined ones
        const filteredSuggestions = suggestions.filter((c) => !communityIds.includes(c.id));
        setSuggestedCommunities(filteredSuggestions);
      } catch (err: unknown) {
        console.error('[JoinedCommunitiesView] Failed to load communities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load joined communities.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunitiesData();
  }, [user]);

  const handleToggleJoin = async (communityId: string, join: boolean) => {
    if (!user) return;

    const current = user.joinedCommunities || [];
    const nextCommunities = join
      ? Array.from(new Set([...current, communityId]))
      : current.filter((id) => id !== communityId);

    try {
      await firestoreService.updateUserCommunities(user.id, nextCommunities);
      await refreshUserProfile();
      setJoinedCommunities((prev) => prev.filter((c) => c.id !== communityId));
    } catch (err: unknown) {
      console.error('[JoinedCommunitiesView] Failed to toggle join status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update community membership.');
    }
  };

  const handleOpenStudio = async (studioId: string) => {
    if (!onSelectStudio) return;
    setLoadingStudioId(studioId);
    try {
      const studio = await firestoreService.fetchStudioById(studioId);
      if (studio) {
        onSelectStudio(studio);
      } else {
        setError(`Studio ${studioId} not found.`);
      }
    } catch (err) {
      console.error('[JoinedCommunitiesView] Failed to fetch studio:', err);
      setError('Failed to open studio profile.');
    } finally {
      setLoadingStudioId(null);
    }
  };

  return (
    <div data-testid="joined-communities-container" className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Navigation Header */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          data-testid="back-button"
          className="group flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Feed</span>
        </button>
      )}

      {/* Header Summary Tile */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-2 backdrop-blur-md transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <span>👥</span>
          <span>My Communities</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You are currently a member of <span className="font-semibold text-indigo-600 dark:text-indigo-400">{joinedCommunities.length}</span> {joinedCommunities.length === 1 ? 'community group' : 'community groups'}. Posts from these groups appear directly in your main feed.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div data-testid="communities-error" className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div data-testid="communities-loading-skeleton" className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 animate-pulse flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800/60 rounded w-2/3"></div>
              </div>
              <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800/60 rounded-xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* Joined Communities List */}
      {!isLoading && joinedCommunities.length > 0 && (
        <div data-testid="joined-communities-list" className="space-y-4">
          {joinedCommunities.map((community) => {
            const studioId = community.linkedStudioId || (community.id.startsWith('comm_studio_') ? community.id.replace('comm_studio_', '') : null);
            const isMenuOpen = activeMenuCommunityId === community.id;

            return (
              <div
                key={community.id}
                data-testid={`joined-community-${community.id}`}
                onClick={() => studioId && handleOpenStudio(studioId)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-3 backdrop-blur-md transition-all hover:border-indigo-500/50 hover:shadow-2xl cursor-pointer relative group"
              >
                {/* Top Header Line: Title + Area Tag + Top Right Joined Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {community.name}
                    </h3>
                    {community.location_prefix && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50 shrink-0 font-semibold">
                        {community.location_prefix}
                      </span>
                    )}
                  </div>

                  <span
                    data-testid={`joined-badge-${community.id}`}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold shrink-0 flex items-center space-x-1"
                  >
                    <span>✓</span>
                    <span>Joined</span>
                  </span>
                </div>

                {/* Middle Row: Hero Icon + Description + Engagement Score */}
                <div className="flex items-start space-x-3.5 pt-1">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xl font-bold shrink-0">
                    {community.id.startsWith('comm_studio_') ? '🏢' : community.id.startsWith('comm_brand_') ? '🧘‍♀️' : '🌴'}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {community.description}
                    </p>
                    <div className="pt-0.5 flex items-center space-x-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      <span>🔥 {community.engagementScore || 0} engagement score</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Primary CTA & 3-Dots Ellipsis Menu */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    {studioId && onSelectStudio && (
                      <button
                        type="button"
                        disabled={loadingStudioId === studioId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudio(studioId);
                        }}
                        data-testid={`view-studio-btn-${community.id}`}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/40 active:scale-95 flex items-center space-x-1.5"
                      >
                        <span>{loadingStudioId === studioId ? 'Opening...' : 'View Studio Profile 🏢 ➔'}</span>
                      </button>
                    )}
                  </div>

                  {/* 3-Dots Ellipsis Overflow Menu Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuCommunityId(isMenuOpen ? null : community.id);
                      }}
                      data-testid={`menu-btn-${community.id}`}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-sm font-bold transition"
                      title="More Actions"
                    >
                      •••
                    </button>

                    {/* Ellipsis Dropdown Popover */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 bottom-10 w-44 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-20 space-y-1 animate-fadeIn"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuCommunityId(null);
                            handleToggleJoin(community.id, false);
                          }}
                          data-testid={`leave-button-${community.id}`}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2 transition"
                        >
                          <span>🚪</span>
                          <span>Leave Community</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && joinedCommunities.length === 0 && (
        <div data-testid="empty-communities-container" className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xl backdrop-blur-md">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xl font-bold">
            🧘‍♀️
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No Joined Communities Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You haven't joined any yoga communities yet. Explore local communities in your area below to get started!
          </p>
        </div>
      )}

      {/* Suggested Communities Section */}
      {!isLoading && suggestedCommunities.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Discover Recommended Communities
          </h3>
          {suggestedCommunities.map((community) => (
            <div
              key={community.id}
              data-testid={`suggested-community-${community.id}`}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between space-x-3 hover:border-indigo-500/40 transition-all"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{community.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{community.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleJoin(community.id, true)}
                data-testid={`join-button-${community.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-all shrink-0"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JoinedCommunitiesView;
