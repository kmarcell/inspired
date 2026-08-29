import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Company, YogaStudio } from '../types';
import { CreateStudioView } from './CreateStudioView';

interface MyStudiosViewProps {
  onBack?: () => void;
  backLabel?: string;
}

export const MyStudiosView: React.FC<MyStudiosViewProps> = ({ onBack, backLabel }) => {
  const { user } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [studios, setStudios] = useState<YogaStudio[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingStudio, setIsCreatingStudio] = useState<boolean>(false);
  const [managingStudio, setManagingStudio] = useState<YogaStudio | null>(null);
  const [bioText, setBioText] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [isSavingBio, setIsSavingBio] = useState<boolean>(false);

  const [deletingStudio, setDeletingStudio] = useState<YogaStudio | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Company Brand Management State
  const [managingCompany, setManagingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState<string>('');
  const [editCompanyEmail, setEditCompanyEmail] = useState<string>('');
  const [editCompanyWebsite, setEditCompanyWebsite] = useState<string>('');
  const [editCompanyDescription, setEditCompanyDescription] = useState<string>('');
  const [isSavingCompany, setIsSavingCompany] = useState<boolean>(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  // In-App Hard Delete Studio Confirmation State
  const [hardDeletingStudio, setHardDeletingStudio] = useState<YogaStudio | null>(null);

  const loadOwnedEntities = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [fetchedCompanies, fetchedStudios] = await Promise.all([
        firestoreService.fetchCompaniesByOwner(user.id),
        firestoreService.fetchStudiosByOwner(user.id),
      ]);
      setCompanies(fetchedCompanies || []);
      setStudios(fetchedStudios || []);
    } catch (err: unknown) {
      console.error('[MyStudiosView] Failed to load owned studios:', err);
      setError(err instanceof Error ? err.message : 'Failed to load owned studios and brands.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOwnedEntities();

    const handleFocus = () => {
      loadOwnedEntities();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const handleOpenManageModal = (st: YogaStudio) => {
    setManagingStudio(st);
    setBioText(st.about || '');
    setStatusNote(st.statusNote || '');
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStudio) return;

    setIsSavingBio(true);
    try {
      await firestoreService.updateStudioBio(managingStudio.id, bioText);
      setManagingStudio(null);
      loadOwnedEntities();
    } catch (err: unknown) {
      console.error('[MyStudiosView] Failed to update bio:', err);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudio) return;

    setIsDeleting(true);
    try {
      await firestoreService.deleteStudio(deletingStudio.id);
      setDeletingStudio(null);
      setManagingStudio(null);
      loadOwnedEntities();
    } catch (err: unknown) {
      console.error('[MyStudiosView] Failed to close studio:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCompanyModal = (comp: Company) => {
    setManagingCompany(comp);
    setEditCompanyName(comp.name || '');
    setEditCompanyEmail(comp.contactEmail || '');
    setEditCompanyWebsite(comp.website || '');
    setEditCompanyDescription(comp.description || '');
    setCompanyError(null);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCompany) return;

    setCompanyError(null);
    if (!editCompanyName.trim()) {
      setCompanyError('Please enter a company brand name.');
      return;
    }
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editCompanyEmail.trim() || !EMAIL_REGEX.test(editCompanyEmail.trim())) {
      setCompanyError('Please enter a valid company contact email.');
      return;
    }

    setIsSavingCompany(true);
    try {
      await firestoreService.updateCompany(managingCompany.id, {
        name: editCompanyName,
        contactEmail: editCompanyEmail,
        website: editCompanyWebsite,
        description: editCompanyDescription,
      });
      setManagingCompany(null);
      loadOwnedEntities();
    } catch (err: unknown) {
      console.error('[MyStudiosView] Failed to update company:', err);
      setCompanyError(err instanceof Error ? err.message : 'Failed to update company brand.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleConfirmDeleteCompany = async () => {
    if (!deletingCompany) return;
    try {
      await firestoreService.deleteCompany(deletingCompany.id);
      setDeletingCompany(null);
      setManagingCompany(null);
      loadOwnedEntities();
    } catch (err: unknown) {
      console.error('[MyStudiosView] Failed to delete company:', err);
    }
  };

  const handleConfirmHardDeleteStudio = async () => {
    if (!hardDeletingStudio) return;
    try {
      await firestoreService.hardDeleteStudio(hardDeletingStudio.id);
      setHardDeletingStudio(null);
      setManagingStudio(null);
      loadOwnedEntities();
    } catch (err: unknown) {
      console.error('[MyStudiosView] Failed to hard delete studio:', err);
    }
  };

  if (isCreatingStudio) {
    return (
      <CreateStudioView
        onClose={() => setIsCreatingStudio(false)}
        onSuccess={() => {
          setIsCreatingStudio(false);
          loadOwnedEntities();
        }}
      />
    );
  }

  const standaloneStudios = studios.filter((s) => !s.companyId);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            data-testid="my-studios-back-button"
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <span>←</span>
            <span>{backLabel || 'Back to Feed'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsCreatingStudio(true)}
          data-testid="add-studio-header-button"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 ml-auto"
        >
          <span>＋</span>
          <span>Add Studio / Brand</span>
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-2 backdrop-blur-md">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          My Brands &amp; Studios
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your physical studio locations and parent brand network across postcodes.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your studios and brands...</div>
      ) : companies.length === 0 && studios.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl text-center space-y-4 backdrop-blur-md">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            🏢
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Manage Your Yoga Studio &amp; Brands
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create your studio brand profile, add location branches across postcodes, and engage with your local yoga community.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingStudio(true)}
            data-testid="create-studio-empty-button"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
          >
            ＋ Create Your Studio Profile
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {companies.map((comp) => {
            const companyBranchStudios = studios.filter((s) => s.companyId === comp.id);

            return (
              <div
                key={comp.id}
                data-testid={`company-card-${comp.id}`}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md"
              >
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
                      {comp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                        <span>{comp.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase">
                          Verified Brand
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{comp.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCompanyModal(comp)}
                    data-testid={`manage-company-btn-${comp.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    ⚙️ Manage
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Studio Locations ({companyBranchStudios.length})
                  </p>

                  {companyBranchStudios.map((st) => (
                      <div
                        key={st.id}
                        data-testid={`studio-item-${st.id}`}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="space-y-1 max-w-md">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                            <span>{st.name}</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">({st.location_prefix})</span>
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.address}</p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {st.status === 'temp_closed' ? (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                              ⏸️ Temp Closed
                            </span>
                          ) : st.isClosed ? (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                              🔴 Closed
                            </span>
                          ) : st.isClaimed ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                              Verified ✓
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                              ⏳ Pending
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenManageModal(st)}
                            data-testid={`manage-studio-btn-${st.id}`}
                            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                          >
                            ⚙️ Manage
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}

          {standaloneStudios.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Independent Studios ({standaloneStudios.length})
              </h2>

              {standaloneStudios.map((st) => (
                <div
                  key={st.id}
                  data-testid={`standalone-studio-item-${st.id}`}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-1 max-w-md">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <span>{st.name}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">({st.location_prefix})</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.address}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {st.status === 'temp_closed' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                        ⏸️ Temp Closed
                      </span>
                    ) : st.isClosed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                        🔴 Closed
                      </span>
                    ) : st.isClaimed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                        Verified ✓
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                        ⏳ Pending
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenManageModal(st)}
                      data-testid={`manage-studio-btn-${st.id}`}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      ⚙️ Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {managingStudio && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <span>⚙️ Manage {managingStudio.name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{managingStudio.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setManagingStudio(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</span>
              {managingStudio.isClosed ? (
                <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold">
                  🔴 Permanently Closed
                </span>
              ) : managingStudio.isClaimed ? (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  Verified Owner ✓
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                  ⏳ Verification Pending
                </span>
              )}
            </div>

            <form onSubmit={handleSaveBio} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Studio Bio / About Text
                </label>
                {!managingStudio.isClaimed && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    🔒 Editable upon verification
                  </span>
                )}
              </div>

              <textarea
                rows={4}
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                disabled={!managingStudio.isClaimed}
                placeholder="A peaceful vinyasa oasis in the heart of London..."
                data-testid="input-edit-studio-bio"
                className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />

              {managingStudio.isClaimed && (
                <button
                  type="submit"
                  disabled={isSavingBio}
                  data-testid="submit-save-bio-button"
                  className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-98"
                >
                  {isSavingBio ? 'Saving Bio...' : 'Save Studio Bio'}
                </button>
              )}
            </form>

            {/* Parent Brand Assignment */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Parent Company Brand Assignment
              </label>
              <select
                value={managingStudio.companyId || 'none'}
                onChange={async (e) => {
                  const selectedId = e.target.value === 'none' ? null : e.target.value;
                  await firestoreService.updateStudioCompany(managingStudio.id, selectedId);
                  setManagingStudio((prev) => (prev ? { ...prev, companyId: selectedId || undefined } : null));
                  loadOwnedEntities();
                }}
                data-testid={`select-studio-company-${managingStudio.id}`}
                className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="none">🏢 None (Independent Studio)</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    🏢 {comp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Operating Status Management */}
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Operating Status
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await firestoreService.updateStudioStatus(managingStudio.id, 'active');
                    setManagingStudio((prev) => (prev ? { ...prev, status: 'active', isClosed: false } : null));
                    loadOwnedEntities();
                  }}
                  data-testid={`status-active-btn-${managingStudio.id}`}
                  className={`py-2 px-2 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center justify-center space-y-1 ${
                    managingStudio.status === 'active' || (!managingStudio.status && !managingStudio.isClosed)
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-base">🟢</span>
                  <span>Open &amp; Active</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await firestoreService.updateStudioStatus(managingStudio.id, 'temp_closed', statusNote);
                    setManagingStudio((prev) => (prev ? { ...prev, status: 'temp_closed', isClosed: false } : null));
                    loadOwnedEntities();
                  }}
                  data-testid={`status-temp-closed-btn-${managingStudio.id}`}
                  className={`py-2 px-2 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center justify-center space-y-1 ${
                    managingStudio.status === 'temp_closed'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-base">⏸️</span>
                  <span>Temp Closed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingStudio(managingStudio)}
                  data-testid={`status-closed-btn-${managingStudio.id}`}
                  className={`py-2 px-2 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center justify-center space-y-1 ${
                    managingStudio.isClosed || managingStudio.status === 'closed'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-base">🔴</span>
                  <span>Closed</span>
                </button>
              </div>

              {managingStudio.status === 'temp_closed' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Temporary Closure Reason / Expected Reopening Note
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    onBlur={async () => {
                      await firestoreService.updateStudioStatus(managingStudio.id, 'temp_closed', statusNote);
                      loadOwnedEntities();
                    }}
                    placeholder="e.g. Closed for summer refurbishment until Sept 15..."
                    data-testid="input-status-note"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Hard Delete Studio Record */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setHardDeletingStudio(managingStudio)}
                  data-testid={`hard-delete-studio-btn-${managingStudio.id}`}
                  className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all active:scale-98 flex items-center justify-center space-x-1.5"
                >
                  <span>🗑️</span>
                  <span>Permanently Delete Studio Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Company Brand Modal */}
      {managingCompany && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <span>⚙️ Manage {managingCompany.name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Parent Company Brand Settings</p>
              </div>
              <button
                type="button"
                onClick={() => setManagingCompany(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {companyError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                ⚠️ {companyError}
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Company Name *
                </label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  placeholder="e.g. Zen Sanctuary Group"
                  data-testid="input-edit-company-name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business Contact Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={editCompanyEmail}
                    onChange={(e) => setEditCompanyEmail(e.target.value)}
                    placeholder="e.g. contact@zensanctuary.co.uk"
                    data-testid="input-edit-company-email"
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  {editCompanyEmail && (
                    <button
                      type="button"
                      onClick={() => setEditCompanyEmail('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] font-bold flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={editCompanyWebsite}
                  onChange={(e) => setEditCompanyWebsite(e.target.value)}
                  placeholder="e.g. https://zensanctuary.co.uk"
                  data-testid="input-edit-company-website"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center space-x-1 font-medium">
                  <span>⚠️</span>
                  <span>Changing your website URL will submit your brand for Admin Re-Verification and temporarily revert your verified badge until approved.</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Description
                </label>
                <textarea
                  rows={3}
                  value={editCompanyDescription}
                  onChange={(e) => setEditCompanyDescription(e.target.value)}
                  placeholder="e.g. Boutique hot yoga sanctuaries..."
                  data-testid="input-edit-company-description"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCompany}
                data-testid="submit-save-company-button"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isSavingCompany ? 'Saving Brand Profile...' : '✨ Save Brand Profile'}
              </button>
            </form>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setDeletingCompany(managingCompany)}
                data-testid={`delete-company-btn-${managingCompany.id}`}
                className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all active:scale-98 flex items-center justify-center space-x-1.5"
              >
                <span>🗑️</span>
                <span>Delete Company Brand</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Closure Confirmation Modal */}
      {deletingStudio && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="text-3xl">🛑</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Mark Studio Location as Closed?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Closing <strong>{deletingStudio.name}</strong> will mark it as permanently closed so existing subscribed members can still view studio history, while hiding it from active discovery. You can reopen it at any time.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudio(null)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                data-testid="confirm-delete-studio-button"
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                {isDeleting ? 'Closing...' : '🔴 Confirm Studio Closure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Hard Delete Studio Confirmation Modal */}
      {hardDeletingStudio && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="text-3xl">🗑️</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Permanently Delete Studio Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to permanently erase <strong>{hardDeletingStudio.name}</strong> from the database? This action cannot be undone.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setHardDeletingStudio(null)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHardDeleteStudio}
                data-testid="confirm-hard-delete-studio-button"
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                🗑️ Confirm Permanent Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Company Brand Confirmation Modal */}
      {deletingCompany && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="text-3xl">🏢</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Delete Company Brand?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deleting brand <strong>{deletingCompany.name}</strong> will not delete your studio locations. All associated studio locations will remain active and move to your <strong>Independent Studios</strong> list, where you can reassign them to another brand at any time.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCompany}
                data-testid="confirm-delete-company-button"
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                🗑️ Confirm Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
