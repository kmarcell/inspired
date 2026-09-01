import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Post, Community } from '../types';
import { FeedPostTile } from './FeedPostTile';

interface CommunityFeedViewProps {
  filterArea?: string;
  hideHeader?: boolean;
}

export const CommunityFeedView: React.FC<CommunityFeedViewProps> = ({ filterArea, hideHeader }) => {
  const { user } = useAuth();
  
  const [area, setArea] = useState<string>('Askew');
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDiscoveryMode, setIsDiscoveryMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  // Touch Pull-to-Refresh state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);

  const loadFeed = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (filterArea) {
        // Studio Branch or Specific Community Feed filtering
        const communityPosts = await firestoreService.fetchCommunityFeed(filterArea);
        setPosts(communityPosts);
        setIsDiscoveryMode(false);
        setArea(filterArea.replace('comm_studio_', '').replace('comm_brand_', ''));
      } else {
        // Standard Area & Joined Communities 3-Tier Feed
        const detectedArea = await firestoreService.detectNearestArea();
        setArea(detectedArea);

        const joinedCommunities = user?.joinedCommunities || [];
        let fetchedPosts = (await firestoreService.fetchFeed(detectedArea, joinedCommunities, 30)) || [];

        if (fetchedPosts.length === 0) {
          fetchedPosts = (await firestoreService.fetchFeed(detectedArea, joinedCommunities, 180)) || [];
        }

        if (fetchedPosts.length === 0) {
          setIsDiscoveryMode(true);
          const suggestions = await firestoreService.fetchSuggestedCommunities(detectedArea);
          setSuggestedCommunities(suggestions);
        } else {
          setPosts(fetchedPosts);
          setIsDiscoveryMode(false);
        }
      }
    } catch (err: unknown) {
      console.error('[CommunityFeedView] Failed to load feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load community feed.');
    } finally {
      setIsLoading(false);
    }
  }, [user, filterArea]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleLikeToggle = (postId: string) => {
    setLikedPostIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(postId)) {
        updated.delete(postId);
      } else {
        updated.add(postId);
      }
      return updated;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart !== null && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStart);
      if (distance > 0 && distance < 120) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50) {
      loadFeed();
    }
    setTouchStart(null);
    setPullDistance(0);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 max-w-xl w-full mx-auto px-4 py-6 space-y-6"
    >
      {/* Pull To Refresh Indicator */}
      {pullDistance > 10 && (
        <div 
          style={{ height: `${Math.min(pullDistance, 60)}px` }}
          className="flex items-center justify-center text-xs font-semibold text-indigo-500 dark:text-indigo-400 overflow-hidden transition-all"
        >
          <div className="flex items-center space-x-2">
            <svg 
              className={`w-4 h-4 ${pullDistance > 50 ? 'rotate-180 transition-transform' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>{pullDistance > 50 ? 'Release to refresh...' : 'Pull down to refresh...'}</span>
          </div>
        </div>
      )}

      {/* Header Banner: Area Awareness & Polished Refresh Button */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur-md transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-lg font-bold">
              📍
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Currently viewing</p>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                <span>{area}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-normal">(W12)</span>
              </h2>
            </div>
          </div>

          {/* Polished SVG Refresh Button */}
          <button
            type="button"
            onClick={loadFeed}
            disabled={isLoading}
            data-testid="refresh-feed-button"
            className="group flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-all shadow-sm shadow-indigo-500/10 disabled:opacity-50"
            title="Refresh Feed"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'transition-transform duration-300 group-hover:rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-medium">Refresh</span>
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div data-testid="feed-error" className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div data-testid="feed-loading-skeleton" className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 animate-pulse space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800/60 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-12 bg-slate-200 dark:bg-slate-800/40 rounded-xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* Posts List */}
      {!isLoading && !isDiscoveryMode && posts.length > 0 && (
        <div data-testid="feed-posts-list" className="space-y-4">
          {posts.map((post) => (
            <FeedPostTile
              key={post.id}
              post={post}
              isLiked={likedPostIds.has(post.id)}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      )}

      {/* Tier 3: Discovery Mode Fallback (Suggested Communities) */}
      {!isLoading && isDiscoveryMode && (
        <div data-testid="discovery-mode-container" className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center space-y-3 backdrop-blur-md">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xl font-bold">
              🔍
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No Recent Posts in {area}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn't find any recent posts in your area. Check out these active suggested communities nearby:
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Suggested Communities
            </h3>
            {suggestedCommunities.map((community) => (
              <div
                key={community.id}
                data-testid={`suggested-community-${community.id}`}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{community.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{community.description}</p>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-all"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityFeedView;
