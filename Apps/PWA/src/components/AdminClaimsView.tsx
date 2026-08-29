import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';

interface ClaimRequestItem {
  id: string;
  studioId: string;
  studioName: string;
  userId: string;
  userEmail: string;
  verificationMethod: string;
  documentFileName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AdminClaimsViewProps {
  onBack: () => void;
}

export const AdminClaimsView: React.FC<AdminClaimsViewProps> = ({ onBack }) => {
  const { user } = useAuth();

  const [claims, setClaims] = useState<ClaimRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const [activeAdminTab, setActiveAdminTab] = useState<'claims' | 'all_studios' | 'staging_invites'>('claims');
  const [studioFilter, setStudioFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [allStudios, setAllStudios] = useState<any[]>([]);
  const [stagingInvites, setStagingInvites] = useState<{ id: string; email: string; invitedBy: string; createdAt: string }[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const loadStagingInvites = async () => {
    try {
      const invites = await firestoreService.fetchStagingInvites();
      setStagingInvites(invites || []);
    } catch (err) {
      console.error('[AdminClaimsView] Failed to load staging invites:', err);
    }
  };

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const [pendingClaims, fetchedStudios, invites] = await Promise.all([
        firestoreService.fetchPendingClaims(),
        firestoreService.fetchAllStudios(),
        firestoreService.fetchStagingInvites(),
      ]);
      setClaims(pendingClaims);
      setAllStudios(fetchedStudios || []);
      setStagingInvites(invites || []);
      if (pendingClaims.length > 0 && !selectedClaim) {
        setSelectedClaim(pendingClaims[0]);
      }
    } catch (err: unknown) {
      console.error('[AdminClaimsView] Failed to load admin queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);

  const handleApprove = async (claim: ClaimRequestItem) => {
    if (processingClaimId) return;
    setProcessingClaimId(claim.id);

    try {
      await firestoreService.approveStudioClaim(claim.id, claim.studioId, claim.userId);
      setActionSuccessMsg(`✓ Claim for "${claim.studioName}" approved! Owner set to ${claim.userEmail}.`);
      await loadClaims();
      setSelectedClaim(null);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: unknown) {
      console.error('[AdminClaimsView] Approval error:', err);
    } finally {
      setProcessingClaimId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || processingClaimId) return;
    setProcessingClaimId(selectedClaim.id);

    try {
      await firestoreService.rejectStudioClaim(selectedClaim.id, rejectionReason.trim());
      setActionSuccessMsg(`✕ Claim for "${selectedClaim.studioName}" rejected.`);
      setShowRejectModal(false);
      setRejectionReason('');
      await loadClaims();
      setSelectedClaim(null);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: unknown) {
      console.error('[AdminClaimsView] Rejection error:', err);
    } finally {
      setProcessingClaimId(null);
    }
  };

  if (!user?.isAdmin && user?.id !== 'user_admin_001') {
    return (
      <div className="flex-1 max-w-xl w-full mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500">You must be logged in as an Inspired Administrator to access this portal.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          data-testid="admin-back-button"
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
        >
          <span>←</span>
          <span>Back to Feed</span>
        </button>

        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
          🛡️ Admin Mode
        </span>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-2 backdrop-blur-md">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Studio Claim Verification Portal
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Review manual proof documents submitted by studio owners to grant verified status.
        </p>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveAdminTab('claims')}
          data-testid="admin-tab-claims"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'claims'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📩 Pending Verification Claims ({claims.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('all_studios')}
          data-testid="admin-tab-all-studios"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'all_studios'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🏢 All Studio Locations ({allStudios.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAdminTab('staging_invites');
            loadStagingInvites();
          }}
          data-testid="admin-tab-staging-invites"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'staging_invites'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ✉️ Invited Members ({stagingInvites.length})
        </button>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div data-testid="admin-action-success" className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-2">
          <span>✨</span>
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Claims Queue Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading admin management portal...</div>
      ) : activeAdminTab === 'claims' ? (
        claims.length === 0 ? (
          <div data-testid="admin-no-claims" className="p-12 text-center rounded-3xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-3xl">🎉</div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All Verification Claims Processed!</p>
            <p className="text-xs text-slate-400">There are currently no pending studio claim requests in the queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                data-testid={`admin-claim-item-${claim.id}`}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900/90 border transition-all space-y-4 ${
                  selectedClaim?.id === claim.id
                    ? 'border-indigo-500 shadow-indigo-500/10 shadow-xl ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/20 inline-block">
                    Pending Verification
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{claim.studioName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Claimant: <strong className="text-slate-800 dark:text-slate-200">{claim.userEmail}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Document: {claim.documentFileName || 'Domain Email Verification'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleApprove(claim)}
                    disabled={!!processingClaimId}
                    data-testid={`approve-claim-${claim.id}`}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {processingClaimId === claim.id ? 'Approving...' : '✓ Approve Claim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClaim(claim);
                      setShowRejectModal(true);
                    }}
                    disabled={!!processingClaimId}
                    data-testid={`reject-claim-${claim.id}`}
                    className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    ✕ Reject Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeAdminTab === 'all_studios' ? (
        /* All Studio Locations Tab with Filter */
        <div className="space-y-4">
          {/* Studio Filter Controls */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Filter Studio Status:</span>
            <div className="flex items-center space-x-1.5">
              {(['all', 'pending', 'verified'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  type="button"
                  onClick={() => setStudioFilter(filterOpt)}
                  data-testid={`filter-studio-${filterOpt}`}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    studioFilter === filterOpt
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filterOpt === 'all' ? `All (${allStudios.length})` : filterOpt === 'pending' ? `Pending / Unverified (${allStudios.filter((s) => !s.isClaimed).length})` : `Verified (${allStudios.filter((s) => s.isClaimed).length})`}
                </button>
              ))}
            </div>
          </div>

          {allStudios.filter((st) => {
            if (studioFilter === 'pending') return !st.isClaimed;
            if (studioFilter === 'verified') return st.isClaimed;
            return true;
          }).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No studios match the selected "{studioFilter}" filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allStudios
                .filter((st) => {
                  if (studioFilter === 'pending') return !st.isClaimed;
                  if (studioFilter === 'verified') return st.isClaimed;
                  return true;
                })
                .map((st) => (
                  <div
                    key={st.id}
                    data-testid={`admin-studio-card-${st.id}`}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                          <span>{st.name}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">({st.location_prefix})</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{st.address}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Owner ID: {st.ownerId || 'Unclaimed Shadow Profile'}</p>
                      </div>

                      {st.isClosed ? (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold">
                          🔴 Closed
                        </span>
                      ) : st.isClaimed ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          Verified ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                          ⏳ Unverified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={async () => {
                          await firestoreService.setStudioClaimedStatus(st.id, !st.isClaimed);
                          setActionSuccessMsg(`✓ Studio "${st.name}" verification toggled to ${!st.isClaimed ? 'Verified' : 'Unverified'}.`);
                          loadClaims();
                          setTimeout(() => setActionSuccessMsg(null), 3000);
                        }}
                        data-testid={`toggle-verify-studio-${st.id}`}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 ${
                          st.isClaimed
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {st.isClaimed ? '🔒 Set Unverified' : '✓ Approve & Verify'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Admin Hard Delete studio "${st.name}"?`)) {
                            await firestoreService.hardDeleteStudio(st.id);
                            setActionSuccessMsg(`🗑️ Studio "${st.name}" permanently deleted.`);
                            loadClaims();
                            setTimeout(() => setActionSuccessMsg(null), 3000);
                          }
                        }}
                        data-testid={`admin-delete-studio-${st.id}`}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all active:scale-95"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Staging Invites Management Tab */}
      {activeAdminTab === 'staging_invites' && (
        <div className="space-y-6">
          {/* Issue Invite Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>✉️</span>
                <span>Issue Staging Preview Invitation</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant access to tester email addresses to preview and test the staging deployment environment.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newInviteEmail.trim() || !user) return;
                setIsSendingInvite(true);
                try {
                  await firestoreService.createStagingInvite(newInviteEmail.trim(), user.id);
                  setActionSuccessMsg(`✓ Staging invitation created for ${newInviteEmail.trim()}`);
                  setNewInviteEmail('');
                  await loadStagingInvites();
                  setTimeout(() => setActionSuccessMsg(null), 3000);
                } catch (err) {
                  console.error('[AdminClaimsView] Create invite error:', err);
                } finally {
                  setIsSendingInvite(false);
                }
              }}
              className="flex items-center space-x-3"
            >
              <input
                type="email"
                required
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="tester@example.com"
                data-testid="input-invite-email"
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSendingInvite || !newInviteEmail.trim()}
                data-testid="submit-invite-button"
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSendingInvite ? 'Sending...' : 'Create Invite'}
              </button>
            </form>
          </div>

          {/* Staging Invites List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Staging Preview Invites ({stagingInvites.length})
            </h2>

            {stagingInvites.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No staging invites issued yet.</p>
            ) : (
              <div className="space-y-2">
                {stagingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    data-testid={`staging-invite-item-${inv.id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{inv.email}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Invited: {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Active'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await firestoreService.deleteStagingInvite(inv.id);
                        setActionSuccessMsg(`✓ Revoked staging invite for ${inv.email}`);
                        await loadStagingInvites();
                        setTimeout(() => setActionSuccessMsg(null), 3000);
                      }}
                      data-testid={`revoke-invite-btn-${inv.id}`}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all active:scale-95"
                    >
                      Revoke Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reject Studio Claim</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rejecting claim for <strong>{selectedClaim.studioName}</strong> ({selectedClaim.userEmail}).
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Optional Rejection Reason (Included in email sent to claimant)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Uploaded utility bill address does not match studio location address."
                  data-testid="input-rejection-reason"
                  className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-rejection-button"
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
