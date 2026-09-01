import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { SearchResult, Community, YogaStudio } from '../types';

interface SearchViewProps {
  initialQuery?: string;
  onClose?: () => void;
  onClaimStudio?: (studioId: string) => void;
  onSelectStudio?: (studio: YogaStudio) => void;
  onSelectCommunity?: (communityId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ 
  initialQuery = '', 
  onClose, 
  onClaimStudio, 
  onSelectStudio,
  onSelectCommunity,
}) => {
  const { user, refreshUserProfile } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const userJoinedSet = new Set(user?.joinedCommunities || []);

  // Fetch suggested communities for Discovery Mode
  useEffect(() => {
    let isMounted = true;
    const loadSuggestions = async () => {
      setIsLoading(true);
      try {
        const area = user?.lastSearchArea || 'Askew';
        const suggestions = await firestoreService.fetchSuggestedCommunities(area);
        if (isMounted) {
          setSuggestedCommunities(suggestions);
        }
      } catch (err) {
        console.error('[SearchView] Failed to load suggestions:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadSuggestions();
    return () => {
      isMounted = false;
    };
  }, [user?.lastSearchArea]);

  // Execute Search with 300ms debounce
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const searchRes = await firestoreService.searchEntities(
          trimmedQuery,
          user?.lastSearchArea || 'W12'
        );
        setResults(searchRes);
      } catch (err) {
        console.error('[SearchView] Search query failed:', err);
        setError('Failed to perform search. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user?.lastSearchArea]);

  // Handle Toggle Join Community
  const handleToggleJoin = async (communityId: string) => {
    if (!user) return;
    setActionLoadingId(communityId);
    setError(null);

    try {
      let updatedCommunities: string[];
      if (userJoinedSet.has(communityId)) {
        updatedCommunities = user.joinedCommunities.filter((id) => id !== communityId);
      } else {
        updatedCommunities = [...user.joinedCommunities, communityId];
      }

      await firestoreService.updateUserCommunities(user.id, updatedCommunities);
      await refreshUserProfile();
    } catch (err) {
      console.error('[SearchView] Failed to toggle join state:', err);
      setError('Failed to update community membership.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-6">
      {/* Top Search Input Bar */}
      <div className="flex items-center space-x-3 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg transition-all">
        <span className="pl-3 text-slate-400 dark:text-slate-500 text-lg">🔍</span>
        <input
          type="text"
          data-testid="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search areas, communities, studios..."
          className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          autoFocus
        />
        {query && (
          <button
            type="button"
            data-testid="clear-search-button"
            onClick={() => setQuery('')}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-all"
          >
            ✕
          </button>
        )}
        {onClose && (
          <button
            type="button"
            data-testid="cancel-search-button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div data-testid="search-error" className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Spinner */}
      {isSearching && (
        <div data-testid="search-loading" className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Searching Inspired network...</p>
        </div>
      )}

      {/* Mode 1: Search Results */}
      {!isSearching && query.trim() !== '' && (
        <div className="space-y-4">
          <h2 data-testid="search-results-header" className="text-base font-bold text-slate-900 dark:text-slate-100">
            Results for &apos;<span className="text-indigo-600 dark:text-indigo-400">{query.trim()}</span>&apos;
          </h2>

          {results.length > 0 ? (
            <div data-testid="search-results-list" className="space-y-3">
              {results.map((result) => {
                const isJoined = userJoinedSet.has(result.id);
                const isLoadingThis = actionLoadingId === result.id;

                return (
                  <div
                    key={result.id}
                    data-testid={`search-result-item-${result.id}`}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-md flex items-center justify-between space-x-4 backdrop-blur-md transition-colors"
                  >
                    <div 
                      onClick={() => result.category !== 'studio' && onSelectCommunity?.(result.id)}
                      className={`flex items-center space-x-3.5 flex-1 min-w-0 ${result.category !== 'studio' ? 'cursor-pointer group' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-md ${
                        result.category === 'studio' 
                          ? 'bg-gradient-to-tr from-purple-600 to-pink-600'
                          : 'bg-gradient-to-tr from-indigo-600 to-blue-600'
                      }`}>
                        {result.category === 'studio' ? '🏢' : result.category === 'area' ? '📍' : '👥'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-400 truncate transition-colors">
                            {result.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-semibold border border-indigo-500/20 shrink-0">
                            {result.category.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      </div>
                    </div>

                    {result.category !== 'studio' ? (
                      <button
                        type="button"
                        disabled={isLoadingThis}
                        data-testid={`toggle-join-${result.id}`}
                        onClick={() => handleToggleJoin(result.id)}
                        className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all shadow-md shrink-0 active:scale-95 disabled:opacity-50 ${
                          isJoined
                            ? 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                      >
                        {isLoadingThis ? '...' : isJoined ? 'Joined ✓' : 'Join +'}
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2 shrink-0">
                        {result.studioData?.status === 'temp_closed' ? (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center space-x-1" title={result.studioData.statusNote}>
                            <span>⏸️</span>
                            <span>Temporarily Closed</span>
                          </span>
                        ) : result.studioData?.isClosed || result.studioData?.status === 'closed' ? (
                          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center space-x-1">
                            <span>🔴</span>
                            <span>Permanently Closed</span>
                          </span>
                        ) : (
                          <>
                            {result.studioData?.isClaimed === false && onClaimStudio && (
                              <button
                                type="button"
                                onClick={() => onClaimStudio(result.id)}
                                data-testid={`claim-studio-btn-${result.id}`}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition-all active:scale-95"
                              >
                                Claim Studio 🏢
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => result.studioData && onSelectStudio?.(result.studioData)}
                              data-testid={`view-studio-btn-${result.id}`}
                              className="px-3.5 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-semibold transition-all active:scale-95"
                            >
                              View Studio ➔
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* No Results Empty State */
            <div data-testid="search-no-results" className="text-center py-8 space-y-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching communities or studios found.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try searching for a different postcode prefix (e.g. W12, W6) or area name.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Discovery Mode (Empty Query or No Results Fallback) */}
      {!isSearching && (query.trim() === '' || results.length === 0) && (
        <div className="space-y-4 pt-2">
          <div>
            <h2 data-testid="discovery-header" className="text-base font-bold text-slate-900 dark:text-slate-100">
              {query.trim() === '' ? 'Discover Communities' : 'Communities Near You'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {query.trim() === '' ? "Explore what's happening nearby." : "Recommended groups based on your detected area."}
            </p>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Loading recommendations...
            </div>
          ) : (
            <div data-testid="discovery-list" className="space-y-3">
              {suggestedCommunities.map((comm) => {
                const isJoined = userJoinedSet.has(comm.id);
                const isLoadingThis = actionLoadingId === comm.id;

                return (
                  <div
                    key={comm.id}
                    data-testid={`discovery-item-${comm.id}`}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-md flex items-center justify-between space-x-4 backdrop-blur-md transition-colors"
                  >
                    <div 
                      onClick={() => onSelectCommunity?.(comm.id)}
                      className="flex items-center space-x-3.5 flex-1 min-w-0 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-md">
                        {comm.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-400 truncate transition-colors">
                            {comm.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-semibold border border-indigo-500/20 shrink-0">
                            {comm.location_prefix}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {comm.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isLoadingThis}
                      data-testid={`toggle-join-${comm.id}`}
                      onClick={() => handleToggleJoin(comm.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all shadow-md shrink-0 active:scale-95 disabled:opacity-50 ${
                        isJoined
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      }`}
                    >
                      {isLoadingThis ? '...' : isJoined ? 'Joined ✓' : 'Join +'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchView;
