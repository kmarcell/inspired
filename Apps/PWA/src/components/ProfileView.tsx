import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { firestoreService } from '../services/firestoreService';
import { PrivacySettings } from '../types';

interface ProfileViewProps {
  onBack?: () => void;
  onNavigateToStudios?: () => void;
  onNavigateToAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, onNavigateToStudios, onNavigateToAdmin }) => {
  const { user, logout, refreshUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [bio, setBio] = useState(user?.bio || '');
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(
    user?.privacySettings || {
      isProfilePublic: false,
      avatarPrivacy: 'groups-only',
      showJoinedGroups: 'members-only',
    }
  );

  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const initialLetter = (user.username || 'U').charAt(0).toUpperCase();

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBio(true);
    setFeedbackMessage(null);
    setErrorMessage(null);

    try {
      await firestoreService.updateUserProfile(user.id, { bio });
      await refreshUserProfile();
      setFeedbackMessage('Bio updated successfully! ✨');
    } catch (err: unknown) {
      console.error('[ProfileView] Failed to save bio:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update bio.');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrivacy(true);
    setFeedbackMessage(null);
    setErrorMessage(null);

    try {
      // Enforce Public Profile Constraint (If isProfilePublic is true, avatarPrivacy must be public)
      const finalPrivacySettings = { ...privacySettings };
      if (finalPrivacySettings.isProfilePublic) {
        finalPrivacySettings.avatarPrivacy = 'public';
      }

      await firestoreService.updateUserProfile(user.id, { privacySettings: finalPrivacySettings });
      await refreshUserProfile();
      setFeedbackMessage('Privacy settings updated successfully! 🔒');
    } catch (err: unknown) {
      console.error('[ProfileView] Failed to save privacy settings:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update privacy settings.');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4">
      {/* Back Button Above Header */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          data-testid="profile-back-button"
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
          title="Back to Feed"
        >
          <span>←</span>
          <span>Back to Feed</span>
        </button>
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your public identity, bio, and privacy settings.
        </p>
      </div>

      {/* Toast Feedback */}
      {feedbackMessage && (
        <div data-testid="profile-feedback" className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          {feedbackMessage}
        </div>
      )}

      {errorMessage && (
        <div data-testid="profile-error" className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md transition-colors">
        <div className="flex items-center space-x-4">
          {!imgError && user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.username}
              onError={() => setImgError(true)}
              className="w-16 h-16 rounded-3xl object-cover ring-4 ring-indigo-500/20 shadow-xl"
            />
          ) : (
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center font-extrabold text-white text-2xl shadow-xl ring-4 ring-indigo-500/20">
              {initialLetter}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user.displayName || 'Inspired Yogi'}</h2>
            <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 inline-block">
              @{user.username}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Member of {user.joinedCommunities?.length || 0} {(user.joinedCommunities?.length || 0) === 1 ? 'community' : 'communities'}
            </p>
          </div>
        </div>
      </div>

      {/* Studio & Company Management Action Card */}
      {onNavigateToStudios && (
        <button
          type="button"
          onClick={onNavigateToStudios}
          data-testid="profile-my-studios-button"
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border border-indigo-500/20 shadow-md transition-all active:scale-[0.98] text-left flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shadow-inner">
              🏢
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                My Studios &amp; Companies
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage your physical studio locations and brand network
              </p>
            </div>
          </div>
          <span className="text-sm text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
        </button>
      )}

      {/* Admin Verification Portal Action Card (Only visible to Admins) */}
      {(user?.isAdmin || user?.id === 'user_admin_001') && onNavigateToAdmin && (
        <button
          type="button"
          onClick={onNavigateToAdmin}
          data-testid="profile-admin-portal-button"
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 hover:from-amber-500/20 hover:via-orange-500/20 hover:to-rose-500/20 border border-amber-500/20 shadow-md transition-all active:scale-[0.98] text-left flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shadow-inner">
              🛡️
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Admin Verification Portal
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Inspect document proofs &amp; process pending studio claims
              </p>
            </div>
          </div>
          <span className="text-sm text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
        </button>
      )}

      {/* Bio Editor Section */}
      <form onSubmit={handleSaveBio} className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between">
          <label htmlFor="user-bio" className="text-sm font-bold text-slate-900 dark:text-slate-200">
            About Me / Bio
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            {bio.length} / 280
          </span>
        </div>

        <textarea
          id="user-bio"
          data-testid="bio-textarea"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 280))}
          placeholder="Share a short intro, your favorite yoga style, or your home area..."
          rows={3}
          className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingBio}
            data-testid="save-bio-button"
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50"
          >
            {isSavingBio ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      {/* Privacy Settings Form */}
      <form onSubmit={handleSavePrivacy} className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-5 backdrop-blur-md transition-colors">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Privacy Control Matrix</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage who can view your profile details and joined groups.</p>
        </div>

        {/* Toggle 1: Public Profile */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Public Profile</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Allow other yogis to discover your profile in search</p>
          </div>
          <button
            type="button"
            data-testid="toggle-public-profile"
            onClick={() =>
              setPrivacySettings((prev: PrivacySettings) => ({
                ...prev,
                isProfilePublic: !prev.isProfilePublic,
                avatarPrivacy: !prev.isProfilePublic ? 'public' : prev.avatarPrivacy,
              }))
            }
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              privacySettings.isProfilePublic ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
          </button>
        </div>

        {/* Select 2: Avatar Privacy */}
        <div className="space-y-1.5 pt-2">
          <label htmlFor="avatar-privacy" className="text-xs font-semibold text-slate-900 dark:text-slate-200">
            Profile Avatar Privacy
          </label>
          <select
            id="avatar-privacy"
            data-testid="select-avatar-privacy"
            value={privacySettings.avatarPrivacy}
            onChange={(e) =>
              setPrivacySettings((prev: PrivacySettings) => ({
                ...prev,
                avatarPrivacy: e.target.value as 'public' | 'groups-only',
              }))
            }
            disabled={privacySettings.isProfilePublic}
            className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500/60 disabled:opacity-50"
          >
            <option value="public">Public (Visible to everyone)</option>
            <option value="groups-only">Groups Only (Visible to members in the same communities as you)</option>
          </select>
        </div>

        {/* Select 3: Joined Groups Visibility */}
        <div className="space-y-1.5 pt-2">
          <label htmlFor="joined-groups-privacy" className="text-xs font-semibold text-slate-900 dark:text-slate-200">
            Who can see which communities you are part of
          </label>
          <select
            id="joined-groups-privacy"
            data-testid="select-joined-groups-privacy"
            value={privacySettings.showJoinedGroups}
            onChange={(e) =>
              setPrivacySettings((prev: PrivacySettings) => ({
                ...prev,
                showJoinedGroups: e.target.value as 'public' | 'groups-only' | 'members-only',
              }))
            }
            className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500/60"
          >
            <option value="public">Public (Visible to everyone)</option>
            <option value="groups-only">Groups Only (Visible to members in the same communities as you)</option>
            <option value="members-only">Only Me / Private (Hidden from everyone)</option>
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingPrivacy}
            data-testid="save-privacy-button"
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50"
          >
            {isSavingPrivacy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      {/* Appearance & Theme Toggle Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span>Appearance &amp; Theme</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch between Light Mode and Dark Mode interface
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            data-testid="profile-theme-toggle"
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center space-x-2 border ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <span>{theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}</span>
          </button>
        </div>
      </div>

      {/* Account Actions Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Account Session</h3>

        <button
          type="button"
          onClick={logout}
          data-testid="logout-button"
          className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold text-sm transition-all shadow-lg shadow-rose-500/10 active:scale-98 flex items-center justify-center space-x-2"
        >
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
