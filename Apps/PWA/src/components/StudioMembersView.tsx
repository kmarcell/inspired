import React, { useState, useEffect } from 'react';
import { StudioMember } from '../types';
import { firestoreService } from '../services/firestoreService';

interface StudioMembersViewProps {
  studioId: string;
  studioName: string;
  isJoined?: boolean;
  onClose: () => void;
  onSelectMemberProfile?: (userId: string) => void;
}

export const StudioMembersView: React.FC<StudioMembersViewProps> = ({
  studioId,
  studioName,
  isJoined = false,
  onClose,
  onSelectMemberProfile,
}) => {
  const [members, setMembers] = useState<StudioMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    firestoreService.fetchStudioMembers(studioId).then((m) => {
      if (isMounted) {
        setMembers(m);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [studioId]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      data-testid="studio-members-modal-backdrop"
    >
      <div 
        className="relative w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100 shadow-2xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="inline-block px-2.5 py-0.5 mb-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              👥 Members Directory
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{studioName}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            aria-label="Close members list"
          >
            ✕
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-xs">No members enrolled yet.</p>
            </div>
          ) : (
            members.map((member) => {
              const privacyLevel = (member as any).privacyLevel || (member.isProfilePublic ? 'public' : 'members-only');
              
              // Public profiles are always clickable.
              // Groups-Only profiles are clickable ONLY if the viewing user is a joined studio member (isJoined === true).
              const isClickable = privacyLevel === 'public' || (privacyLevel === 'groups-only' && isJoined);

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    if (isClickable && onSelectMemberProfile) {
                      onSelectMemberProfile(member.id);
                      onClose();
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isClickable
                      ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 cursor-pointer'
                      : 'bg-slate-100/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900 opacity-75 cursor-not-allowed'
                  }`}
                  data-testid={`member-row-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center font-bold text-xs text-white">
                      {member.displayName.charAt(0)}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{member.displayName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Adaptive Privacy Guard Badge */}
                  <div>
                    {privacyLevel === 'public' ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        Public Profile ➔
                      </span>
                    ) : privacyLevel === 'groups-only' && isJoined ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        👥 Groups-Only ➔
                      </span>
                    ) : privacyLevel === 'groups-only' && !isJoined ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50">
                        🔒 Groups-Only (Join to View)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border border-slate-300 dark:border-slate-700/50">
                        🔒 Private Profile
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
