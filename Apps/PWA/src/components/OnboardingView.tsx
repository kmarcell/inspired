import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService, ProfileValidationError } from '../services/firestoreService';
import { UserProfile, PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '../types';

export const OnboardingView: React.FC = () => {
  const { onboardingUserId, onboardingDisplayName, completeOnboarding } = useAuth();
  
  const [displayName, setDisplayName] = useState(onboardingDisplayName || '');
  const [discriminator] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate handle format: name#XXXX (with random 4-digit discriminator)
  const formattedName = displayName.trim().toLowerCase().replace(/\s+/g, '_');
  const proposedUsername = `${formattedName.length > 0 ? formattedName : 'username'}#${discriminator}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingUserId) return;

    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Validate display name via Cloud Function
      await firestoreService.validateDisplayName(displayName);

      // Enforce Public Profile Constraint (If isProfilePublic is true, avatarPrivacy must be public)
      const finalPrivacySettings = { ...privacySettings };
      if (finalPrivacySettings.isProfilePublic) {
        finalPrivacySettings.avatarPrivacy = 'public';
      }

      // 2. Build UserProfile object
      const now = new Date().toISOString();
      const newUser: UserProfile = {
        id: onboardingUserId,
        username: proposedUsername,
        displayName: displayName.trim(),
        joinedCommunities: [],
        privacySettings: finalPrivacySettings,
        createdAt: now,
        updatedAt: now,
      };

      // 3. Save profile to Firestore
      await firestoreService.createUserProfile(newUser);

      // 4. Update AuthContext state to authenticated
      completeOnboarding(newUser);
    } catch (err: unknown) {
      console.error('[OnboardingView] Setup failed:', err);
      if (err instanceof ProfileValidationError) {
        setError(err.reason);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create profile.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto px-6 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/30 text-white text-2xl font-bold">
          I
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Setup Your Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Choose your display details and privacy preferences.
        </p>
      </div>

      {/* Onboarding Form Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 backdrop-blur-xl transition-colors">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        {/* Error Alert */}
        {error && (
          <div data-testid="onboarding-error" className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="display-name-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Display Name
            </label>
            <input
              id="display-name-input"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Jane Doe"
              disabled={isLoading}
              data-testid="display-name-input"
              className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
            />
            <p className="text-[11px] text-slate-500">Minimum 2 characters.</p>
          </div>

          {/* Generated Handle Field */}
          <div className="space-y-1.5">
            <label htmlFor="handle-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Username Handle
            </label>
            <input
              id="handle-input"
              type="text"
              value={proposedUsername}
              readOnly
              disabled
              data-testid="proposed-handle-input"
              className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-mono text-xs cursor-not-allowed selection:bg-none"
            />
            <p className="text-[11px] text-slate-500">
              Handles are automatically assigned with a unique 4-digit tag.
            </p>
          </div>

          {/* Privacy Toggles Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300">Privacy Preferences</h3>

            {/* Toggle 1: Public Profile */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-300">Public Profile</p>
                <p className="text-[10px] text-slate-500">Findable in public teacher/yogi search</p>
              </div>
              <button
                type="button"
                data-testid="onboarding-toggle-public"
                onClick={() =>
                  setPrivacySettings((prev: PrivacySettings) => ({
                    ...prev,
                    isProfilePublic: !prev.isProfilePublic,
                    avatarPrivacy: !prev.isProfilePublic ? 'public' : prev.avatarPrivacy,
                  }))
                }
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  privacySettings.isProfilePublic ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Select 2: Joined Communities Privacy */}
            <div className="space-y-1">
              <label htmlFor="onboarding-joined-privacy" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Who can see which communities you are part of
              </label>
              <select
                id="onboarding-joined-privacy"
                data-testid="onboarding-select-joined-privacy"
                value={privacySettings.showJoinedGroups}
                onChange={(e) =>
                  setPrivacySettings((prev: PrivacySettings) => ({
                    ...prev,
                    showJoinedGroups: e.target.value as 'public' | 'groups-only' | 'members-only',
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="members-only">Only Me / Private (Recommended)</option>
                <option value="groups-only">Groups Only (Members in the same communities as you)</option>
                <option value="public">Public (Visible to everyone)</option>
              </select>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={displayName.trim().length < 2 || isLoading}
            data-testid="confirm-profile-button"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all font-semibold text-sm text-white shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating profile...' : 'Complete Profile Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingView;
