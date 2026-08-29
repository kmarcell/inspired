import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { YogaStudio } from '../types';

interface ClaimStudioViewProps {
  studioId: string;
  claimToken?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClaimStudioView: React.FC<ClaimStudioViewProps> = ({
  studioId,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [studio, setStudio] = useState<YogaStudio | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadStudio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetched = await firestoreService.fetchStudioById(studioId);
        setStudio(fetched);
      } catch (err: unknown) {
        console.error('[ClaimStudioView] Error loading studio:', err);
        setError('Failed to load studio details for verification.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStudio();
  }, [studioId]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittedStatus || !user || !studio) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await firestoreService.submitStudioClaim(
        user.id,
        user.username || 'user@inspired.yoga',
        studio.id,
        studio.name,
        documentFile?.name
      );

      if (res.status === 'approved') {
        setSubmittedStatus('approved');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setSubmittedStatus('pending');
      }
    } catch (err: unknown) {
      console.error('[ClaimStudioView] Claim submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit studio claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={onClose}
        data-testid="claim-studio-back-button"
        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading studio profile...</div>
      ) : error ? (
        <div data-testid="claim-studio-error" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      ) : !studio ? (
        <div className="p-12 text-center text-xs text-slate-400">Studio not found.</div>
      ) : studio.isClaimed ? (
        <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
          <div className="text-2xl">✓</div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {studio.name} is Already Verified
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This studio profile has already been claimed by a verified owner.
          </p>
        </div>
      ) : submittedStatus === 'pending' ? (
        <div data-testid="claim-submitted-banner" className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
          <div className="text-3xl">📩</div>
          <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            Verification Claim Submitted!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Your claim request for <strong>{studio.name}</strong> has been submitted for manual admin review. Inspired Admins will inspect your document proof and update your status via email.
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="claim-done-button"
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Done / Return to Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-2 backdrop-blur-md">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/20 inline-block">
              Unclaimed Shadow Profile
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Claim {studio.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              📍 {studio.location_prefix} • {studio.address}
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmitClaim} className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Claimant User Identity
              </label>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {user?.displayName || user?.username}
                </p>
                <p className="text-slate-400 font-mono text-[11px]">@{user?.username}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Proof of Ownership Document (Utility Bill / Insurance / Business License)
              </label>
              <input
                type="file"
                data-testid="input-claim-document"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-500/10 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-500/20"
              />
              <p className="text-[11px] text-slate-400">
                Upload a utility bill, lease agreement, or insurance certificate matching the studio address for instant admin review.
              </p>
            </div>

            <button
              type="submit"
              data-testid="submit-claim-button"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Verification Claim...' : '✨ Submit Verification Claim'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
