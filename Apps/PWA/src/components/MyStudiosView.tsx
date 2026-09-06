import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Company, YogaStudio, CompanyCurrency, StudioCurrencyPolicy, CurrencyTierType } from '../types';
import { CreateStudioView } from './CreateStudioView';
import { AdminGrantPassModalView } from './AdminGrantPassModalView';

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
  const [isSavingBio, setIsSavingBio] = useState<boolean>(false);

  // Company Brand Management State
  const [managingCompany, setManagingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState<string>('');
  const [editCompanyEmail, setEditCompanyEmail] = useState<string>('');
  const [editCompanyWebsite, setEditCompanyWebsite] = useState<string>('');
  const [editCompanyDescription, setEditCompanyDescription] = useState<string>('');
  const [isSavingCompany, setIsSavingCompany] = useState<boolean>(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  // Subpage Active Tab States
  const [brandActiveTab, setBrandActiveTab] = useState<'studios' | 'currencies' | 'settings'>('studios');
  const [studioActiveTab, setStudioActiveTab] = useState<'general' | 'pricing'>('general');



  // Section 5.20 Currency Catalog & Policy State
  const [companyCurrencies, setCompanyCurrencies] = useState<CompanyCurrency[]>([]);
  const [studioPolicy, setStudioPolicy] = useState<StudioCurrencyPolicy | null>(null);
  const [isAddingCurrency, setIsAddingCurrency] = useState<boolean>(false);
  const [newCurrTitle, setNewCurrTitle] = useState<string>('');
  const [newCurrDesc, setNewCurrDesc] = useState<string>('');
  const [newCurrTier, setNewCurrTier] = useState<CurrencyTierType>('drop_in');
  const [newCurrCredits, setNewCurrCredits] = useState<number>(1);
  const [newCurrPrice, setNewCurrPrice] = useState<number>(15);
  const [newCurrValidity, setNewCurrValidity] = useState<number>(30);

  // Currency Editing State
  const [editingCurrencyId, setEditingCurrencyId] = useState<string | null>(null);
  const [editCurrTitle, setEditCurrTitle] = useState<string>('');
  const [editCurrDesc, setEditCurrDesc] = useState<string>('');
  const [editCurrTier, setEditCurrTier] = useState<CurrencyTierType>('drop_in');
  const [editCurrCredits, setEditCurrCredits] = useState<number>(1);
  const [editCurrPrice, setEditCurrPrice] = useState<number>(15);
  const [editCurrValidity, setEditCurrValidity] = useState<number>(30);

  const [isGrantingPass, setIsGrantingPass] = useState<boolean>(false);
  const [statusNoteText, setStatusNoteText] = useState<string>('');
  const [isSavingStatusNote, setIsSavingStatusNote] = useState<boolean>(false);

  const handleStartEditCurrency = (curr: CompanyCurrency) => {
    setEditingCurrencyId(curr.id);
    setEditCurrTitle(curr.title || '');
    setEditCurrDesc(curr.description || '');
    setEditCurrTier(curr.tierType || 'drop_in');
    setEditCurrPrice(curr.basePriceAmount || 0);
    setEditCurrCredits(curr.creditCount || 1);
    setEditCurrValidity(curr.validityDays || 30);
  };

  const handleSaveEditCurrency = async (currId: string) => {
    if (!editCurrTitle.trim()) return;
    try {
      const updates: Partial<CompanyCurrency> = {
        title: editCurrTitle,
        description: editCurrDesc,
        tierType: editCurrTier,
        basePriceAmount: editCurrPrice,
        validityDays: editCurrValidity,
      };
      if (editCurrTier !== 'unlimited') {
        updates.creditCount = editCurrCredits;
      }
      await firestoreService.updateCompanyCurrency(currId, updates);
      setEditingCurrencyId(null);

      if (managingStudio) {
        if (managingStudio.companyId) {
          const updated = await firestoreService.fetchCompanyCurrencies(managingStudio.companyId);
          setCompanyCurrencies(updated);
        } else {
          const updated = await firestoreService.fetchStudioCurrencies(managingStudio.id);
          setCompanyCurrencies(updated);
        }
      } else if (managingCompany) {
        const updated = await firestoreService.fetchCompanyCurrencies(managingCompany.id);
        setCompanyCurrencies(updated);
      }
    } catch (err: unknown) {
      console.error('[MyStudiosView] Failed to update currency:', err);
    }
  };

  const loadOwnedEntities = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      let [fetchedCompanies, fetchedStudios] = await Promise.all([
        firestoreService.fetchCompaniesByOwner(user.id),
        firestoreService.fetchStudiosByOwner(user.id),
      ]);

      // If user is an Admin and has no explicit ownership records, load all platform brands & studios for testing
      if (user.isAdmin && (fetchedCompanies.length === 0 || fetchedStudios.length === 0)) {
        const [allCompanies, allStudios] = await Promise.all([
          firestoreService.fetchAllCompanies(),
          firestoreService.fetchAllStudios(),
        ]);
        if (fetchedCompanies.length === 0) fetchedCompanies = allCompanies;
        if (fetchedStudios.length === 0) fetchedStudios = allStudios;
      }

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

  useEffect(() => {
    if (!managingStudio) return;

    setStatusNoteText(managingStudio.statusNote || '');

    const loadStudioPricingData = async () => {
      // 1. Fetch policy
      try {
        const policy = await firestoreService.fetchStudioCurrencyPolicy(managingStudio.id);
        setStudioPolicy(policy);
      } catch {
        setStudioPolicy(null);
      }

      // 2. Fetch parent company currencies OR independent studio currencies
      const compId = managingStudio.companyId;
      if (compId) {
        try {
          const currencies = await firestoreService.fetchCompanyCurrencies(compId);
          setCompanyCurrencies(currencies);
        } catch (err) {
          console.error('[MyStudiosView] Failed to fetch company currencies for studio:', err);
          setCompanyCurrencies([]);
        }
      } else {
        try {
          const studioCurrencies = await firestoreService.fetchStudioCurrencies(managingStudio.id);
          setCompanyCurrencies(studioCurrencies);
        } catch (err) {
          console.error('[MyStudiosView] Failed to fetch studio currencies:', err);
          setCompanyCurrencies([]);
        }
      }
    };

    loadStudioPricingData();
  }, [managingStudio?.id, managingStudio?.companyId]);

  const handleOpenManageModal = async (st: YogaStudio) => {
    setManagingStudio(st);
    setCompanyCurrencies([]);
    setStudioPolicy(null);
    setBioText(st.about || '');
    setStatusNoteText(st.statusNote || '');
    setStudioActiveTab('general');
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

  const handleOpenCompanyModal = async (comp: Company) => {
    setManagingCompany(comp);
    setEditCompanyName(comp.name || '');
    setEditCompanyEmail(comp.contactEmail || '');
    setEditCompanyWebsite(comp.website || '');
    setEditCompanyDescription(comp.description || '');
    setCompanyError(null);
    setBrandActiveTab('studios');

    try {
      const currencies = await firestoreService.fetchCompanyCurrencies(comp.id);
      setCompanyCurrencies(currencies);
    } catch {
      setCompanyCurrencies([]);
    }
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

  // --- SUBPAGE 2: STUDIO LOCATION MANAGEMENT SUBPAGE ---
  if (managingStudio) {
    const parentCompany = managingStudio.companyId
      ? (companies.find((c) => c.id === managingStudio.companyId) || (managingCompany?.id === managingStudio.companyId ? managingCompany : undefined))
      : undefined;
    const backButtonText = parentCompany ? `Back to ${parentCompany.name}` : 'Back to My Studios';

    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6 text-slate-900 dark:text-slate-100 animate-fadeIn">
        {/* Push / Pop Subpage Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <button
            type="button"
            onClick={() => setManagingStudio(null)}
            data-testid="studio-back-button"
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <span>←</span>
            <span>{backButtonText}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsGrantingPass(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition"
          >
            🎁 Grant Pass to Member
          </button>
        </div>

        {/* Studio Overview Header */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>🧘</span>
              <span>{managingStudio.name}</span>
            </h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                managingStudio.status === 'temp_closed'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : managingStudio.isClosed || managingStudio.status === 'closed'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {managingStudio.status === 'temp_closed'
                ? '🟡 Temporarily Closed'
                : managingStudio.isClosed || managingStudio.status === 'closed'
                ? '🔴 Permanently Closed'
                : '🟢 Open & Active'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{managingStudio.address}</p>
        </div>

        {/* Tab Navigation Selector */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setStudioActiveTab('general')}
            data-testid="studio-tab-general"
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all ${
              studioActiveTab === 'general'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ⚙️ General Settings
          </button>
          <button
            type="button"
            onClick={() => setStudioActiveTab('pricing')}
            data-testid="studio-tab-pricing"
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all ${
              studioActiveTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            💳 Pricing &amp; Currency Policy
          </button>
        </div>

        {/* TAB 1: GENERAL SETTINGS */}
        {studioActiveTab === 'general' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
            {/* Bio Editor Form */}
            <form onSubmit={handleSaveBio} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Studio Bio / About Text</label>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Heated flows, dynamic Vinyasa, sound baths..."
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={isSavingBio}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSavingBio ? 'Saving...' : 'Save Studio Bio'}
              </button>
            </form>

            {/* Parent Brand Assignment Selector */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Parent Brand Assignment</label>
              <select
                value={managingStudio.companyId || ''}
                onChange={async (e) => {
                  const compId = e.target.value;
                  await firestoreService.assignStudioToCompany(managingStudio.id, compId || null);
                  setManagingStudio({ ...managingStudio, companyId: compId || undefined });
                  loadOwnedEntities();
                }}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
              >
                <option value="">Independent Location (No Parent Brand)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Studio Operating Status Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Location Operating Status
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Control whether this location is open for bookings, temporarily paused, or closed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await firestoreService.updateStudioStatus(managingStudio.id, 'active', statusNoteText);
                    setManagingStudio({ ...managingStudio, status: 'active', isClosed: false, statusNote: statusNoteText });
                    loadOwnedEntities();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                    managingStudio.status === 'active' || (!managingStudio.status && !managingStudio.isClosed)
                      ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">🟢 Open &amp; Active</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Location is active and accepting class bookings.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await firestoreService.updateStudioStatus(managingStudio.id, 'temp_closed', statusNoteText);
                    setManagingStudio({ ...managingStudio, status: 'temp_closed', isClosed: false, statusNote: statusNoteText });
                    loadOwnedEntities();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                    managingStudio.status === 'temp_closed'
                      ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">🟡 Temp Closed</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Paused for renovations, breaks, or maintenance.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await firestoreService.updateStudioStatus(managingStudio.id, 'closed', statusNoteText);
                    setManagingStudio({ ...managingStudio, status: 'closed', isClosed: true, statusNote: statusNoteText });
                    loadOwnedEntities();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                    managingStudio.status === 'closed' || (managingStudio.isClosed && managingStudio.status !== 'temp_closed')
                      ? 'bg-rose-500/10 border-rose-500 text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">🔴 Permanently Closed</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Location is permanently shut down.
                  </p>
                </button>
              </div>

              {/* Status Note Input Field (Visible when temp_closed or closed) */}
              {(managingStudio.status === 'temp_closed' || managingStudio.status === 'closed' || managingStudio.isClosed) && (() => {
                const isStatusNoteDirty = statusNoteText !== (managingStudio.statusNote || '');

                return (
                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800/80 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {managingStudio.status === 'temp_closed'
                          ? '🟡 Temporary Closure Message / Reopening Date'
                          : '🔴 Closure Announcement / Note'}
                      </label>

                      {isSavingStatusNote ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center space-x-1 animate-pulse">
                          <span>🌀</span>
                          <span>Saving...</span>
                        </span>
                      ) : isStatusNoteDirty ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center space-x-1">
                          <span>✏️</span>
                          <span>Unsaved Changes</span>
                        </span>
                      ) : statusNoteText ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                          <span>✓</span>
                          <span>Saved &amp; Active</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={statusNoteText}
                          onChange={(e) => setStatusNoteText(e.target.value)}
                          placeholder={
                            managingStudio.status === 'temp_closed'
                              ? 'e.g. Closed for summer refurbishment. Reopening Oct 1st!'
                              : 'e.g. Permanently closed as of Sept 2026. Thank you!'
                          }
                          className={`w-full p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition ${
                            isStatusNoteDirty
                              ? 'border-amber-400 dark:border-amber-500/60 focus:ring-amber-500'
                              : 'border-slate-300 dark:border-slate-800 focus:ring-indigo-500'
                          }`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">
                          {isSavingStatusNote ? (
                            '🌀'
                          ) : isStatusNoteDirty ? (
                            <span title="Unsaved changes pending" className="text-amber-500 font-bold">✏️</span>
                          ) : statusNoteText ? (
                            <span title="Note saved" className="text-emerald-500 font-extrabold">✓</span>
                          ) : null}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isSavingStatusNote || !isStatusNoteDirty}
                        onClick={async () => {
                          setIsSavingStatusNote(true);
                          try {
                            const st = managingStudio.status || (managingStudio.isClosed ? 'closed' : 'active');
                            await firestoreService.updateStudioStatus(managingStudio.id, st, statusNoteText);
                            setManagingStudio({ ...managingStudio, statusNote: statusNoteText });
                            loadOwnedEntities();
                          } catch (err) {
                            console.error('[MyStudiosView] Failed to save status note:', err);
                          } finally {
                            setIsSavingStatusNote(false);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-1.5 ${
                          !isStatusNoteDirty
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
                        }`}
                      >
                        {isSavingStatusNote ? (
                          <span>Saving...</span>
                        ) : !isStatusNoteDirty ? (
                          <>
                            <span>✓</span>
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>Save Note</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      This note will be prominently displayed on the studio profile page for yogis and members to see why it&apos;s closed and when it will reopen.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 2: PRICING & CURRENCY POLICY */}
        {studioActiveTab === 'pricing' && (() => {
          const hasParentBrand = !!managingStudio.companyId;
          const currentMode = hasParentBrand
            ? (studioPolicy?.policyMode || 'follow_brand')
            : 'custom_override';

          return (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Currency Acceptance Policy</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasParentBrand
                    ? 'Choose whether this location follows parent brand pricing or uses a custom override.'
                    : 'This is an independent studio location. Custom location pricing & passes apply.'}
                </p>
              </div>

              {/* Policy Selector Cards */}
              {hasParentBrand ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={async () => {
                      const compId = managingStudio.companyId;
                      const newPolicy: StudioCurrencyPolicy = {
                        studioId: managingStudio.id,
                        ...(compId ? { companyId: compId } : {}),
                        policyMode: 'follow_brand',
                        acceptedCurrencyIds: companyCurrencies.map((c) => c.id),
                        updatedAt: new Date().toISOString(),
                      };
                      await firestoreService.saveStudioCurrencyPolicy(newPolicy);
                      setStudioPolicy(newPolicy);
                    }}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition ${
                      currentMode === 'follow_brand'
                        ? 'bg-indigo-500/10 border-indigo-500 text-slate-900 dark:text-white shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">🏛️ Follow Brand Pricing</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Accepts all credit packs & passes issued by parent brand.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const compId = managingStudio.companyId;
                      const initialAccepted = studioPolicy?.acceptedCurrencyIds?.length
                        ? studioPolicy.acceptedCurrencyIds
                        : companyCurrencies.map((c) => c.id);
                      const newPolicy: StudioCurrencyPolicy = {
                        studioId: managingStudio.id,
                        ...(compId ? { companyId: compId } : {}),
                        policyMode: 'custom_override',
                        acceptedCurrencyIds: initialAccepted,
                        updatedAt: new Date().toISOString(),
                      };
                      await firestoreService.saveStudioCurrencyPolicy(newPolicy);
                      setStudioPolicy(newPolicy);
                    }}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition ${
                      currentMode === 'custom_override'
                        ? 'bg-indigo-500/10 border-indigo-500 text-slate-900 dark:text-white shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">⚙️ Custom Location Pricing</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Set independent drop-in rates and location-specific passes.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 flex items-center space-x-3 text-xs">
                  <span className="text-base">📍</span>
                  <div>
                    <span className="font-bold">Independent Studio Location:</span> This location operates independently with custom location pricing & passes.
                  </div>
                </div>
              )}

            {/* Currencies & Passes List */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>💳</span>
                    <span>
                      {!hasParentBrand
                        ? 'Location Currencies & Passes'
                        : studioPolicy?.policyMode === 'custom_override'
                        ? 'Custom Accepted Location Currencies'
                        : 'Inherited Brand Currencies & Passes'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {!hasParentBrand
                      ? 'Pricing packages and pass tiers configured specifically for this independent studio.'
                      : studioPolicy?.policyMode === 'custom_override'
                      ? 'Select which brand passes and pricing packages are accepted at this location.'
                      : 'All credit packs & passes below are automatically accepted at this location.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCurrency(true)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1"
                >
                  <span>＋</span>
                  <span>Create Currency</span>
                </button>
              </div>

              {/* Add Currency Form for Studio */}
              {isAddingCurrency && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                    {!hasParentBrand ? 'New Independent Studio Currency Pass' : 'New Location Custom Currency Pass'}
                  </h3>
                  <input
                    type="text"
                    placeholder="Pass Title e.g. Single Drop-In or 5-Class Pack"
                    value={newCurrTitle}
                    onChange={(e) => setNewCurrTitle(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Description e.g. Valid for any yoga class at this studio"
                    value={newCurrDesc}
                    onChange={(e) => setNewCurrDesc(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Tier Type</label>
                      <select
                        value={newCurrTier}
                        onChange={(e) => setNewCurrTier(e.target.value as CurrencyTierType)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      >
                        <option value="drop_in">Single Drop-In</option>
                        <option value="credit_pack">Multi-Class Credit Pack</option>
                        <option value="unlimited">Unlimited Pass</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Base Price (£)</label>
                      <input
                        type="number"
                        value={newCurrPrice}
                        onChange={(e) => setNewCurrPrice(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Credit Count</label>
                      <input
                        type="number"
                        value={newCurrCredits}
                        onChange={(e) => setNewCurrCredits(Number(e.target.value))}
                        disabled={newCurrTier === 'unlimited'}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Lifespan (Days)</label>
                      <input
                        type="number"
                        value={newCurrValidity}
                        onChange={(e) => setNewCurrValidity(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCurrency(false)}
                      className="w-1/2 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                    >
                      ✕ Discard Changes
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCurrTitle.trim()) return;
                        try {
                          const currencyPayload: Omit<CompanyCurrency, 'id' | 'createdAt' | 'updatedAt'> = {
                            studioId: managingStudio.id,
                            ...(managingStudio.companyId ? { companyId: managingStudio.companyId } : {}),
                            title: newCurrTitle,
                            description: newCurrDesc || 'Studio Location Pass',
                            tierType: newCurrTier,
                            basePriceAmount: newCurrPrice,
                            currencySymbol: '£',
                            validityDays: newCurrValidity,
                            allowedStudioIds: [managingStudio.id],
                          };
                          if (newCurrTier !== 'unlimited') {
                            currencyPayload.creditCount = newCurrCredits;
                          }

                          const created = await firestoreService.createCompanyCurrency(currencyPayload);
                          setIsAddingCurrency(false);
                          setNewCurrTitle('');
                          setNewCurrDesc('');

                          const compId = managingStudio.companyId;
                          if (compId) {
                            const updatedComp = await firestoreService.fetchCompanyCurrencies(compId);
                            setCompanyCurrencies(updatedComp);
                          } else {
                            const updatedStudio = await firestoreService.fetchStudioCurrencies(managingStudio.id);
                            setCompanyCurrencies(updatedStudio);

                            const currentAccepted = studioPolicy?.acceptedCurrencyIds || [];
                            const newAccepted = Array.from(new Set([...currentAccepted, created.id]));
                            const updatedPolicy: StudioCurrencyPolicy = {
                              studioId: managingStudio.id,
                              policyMode: 'custom_override',
                              acceptedCurrencyIds: newAccepted,
                              updatedAt: new Date().toISOString(),
                            };
                            await firestoreService.saveStudioCurrencyPolicy(updatedPolicy);
                            setStudioPolicy(updatedPolicy);
                          }
                        } catch (err: unknown) {
                          console.error('[MyStudiosView] Failed to create studio currency:', err);
                        }
                      }}
                      className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                    >
                      ✓ Save Currency Changes
                    </button>
                  </div>
                </div>
              )}

              {companyCurrencies.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {!hasParentBrand
                      ? 'No location passes or pricing packages created yet for this independent studio.'
                      : 'No brand currencies or pricing packages created yet for this brand network.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companyCurrencies.map((curr) => {
                    const isCustomMode = studioPolicy?.policyMode === 'custom_override';
                    const isAccepted =
                      !hasParentBrand ||
                      !isCustomMode ||
                      (studioPolicy?.acceptedCurrencyIds?.length === 0 && true) ||
                      studioPolicy?.acceptedCurrencyIds?.includes(curr.id);

                    if (editingCurrencyId === curr.id) {
                      return (
                        <div
                          key={curr.id}
                          className="p-4 bg-slate-100 dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Edit Currency Package</h4>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {curr.id}</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Pass Title"
                            value={editCurrTitle}
                            onChange={(e) => setEditCurrTitle(e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={editCurrDesc}
                            onChange={(e) => setEditCurrDesc(e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Tier Type</label>
                              <select
                                value={editCurrTier}
                                onChange={(e) => setEditCurrTier(e.target.value as CurrencyTierType)}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                              >
                                <option value="drop_in">Single Drop-In</option>
                                <option value="credit_pack">Multi-Class Credit Pack</option>
                                <option value="unlimited">Unlimited Pass</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Base Price (£)</label>
                              <input
                                type="number"
                                value={editCurrPrice}
                                onChange={(e) => setEditCurrPrice(Number(e.target.value))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Credit Count</label>
                              <input
                                type="number"
                                value={editCurrCredits}
                                onChange={(e) => setEditCurrCredits(Number(e.target.value))}
                                disabled={editCurrTier === 'unlimited'}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Lifespan (Days)</label>
                              <input
                                type="number"
                                value={editCurrValidity}
                                onChange={(e) => setEditCurrValidity(Number(e.target.value))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingCurrencyId(null)}
                              className="w-1/2 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                            >
                              ✕ Discard Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditCurrency(curr.id)}
                              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                            >
                              ✓ Save Currency Changes
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={curr.id}
                        className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                          isAccepted
                            ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                            : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isCustomMode && (
                            <input
                              type="checkbox"
                              checked={!!isAccepted}
                              onChange={async (e) => {
                                const compId = managingStudio.companyId;
                                const currentAccepted = studioPolicy?.acceptedCurrencyIds || companyCurrencies.map((c) => c.id);
                                const newAccepted = e.target.checked
                                  ? Array.from(new Set([...currentAccepted, curr.id]))
                                  : currentAccepted.filter((id) => id !== curr.id);

                                const updatedPolicy: StudioCurrencyPolicy = {
                                  studioId: managingStudio.id,
                                  ...(compId ? { companyId: compId } : {}),
                                  policyMode: 'custom_override',
                                  acceptedCurrencyIds: newAccepted,
                                  updatedAt: new Date().toISOString(),
                                };

                                await firestoreService.saveStudioCurrencyPolicy(updatedPolicy);
                                setStudioPolicy(updatedPolicy);
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{curr.title}</h4>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                {curr.tierType === 'unlimited' ? 'Unlimited' : `${curr.creditCount} Credits`}
                              </span>
                              {!isCustomMode && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Inherited
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{curr.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              {curr.currencySymbol || '£'}{curr.basePriceAmount}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              {curr.validityDays} Days Lifespan
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEditCurrency(curr)}
                            data-testid={`edit-currency-${curr.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95 flex items-center space-x-1"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

        {/* Admin Pass Granting Modal */}
        {isGrantingPass && user && (
          <AdminGrantPassModalView
            studioId={managingStudio.id}
            studioName={managingStudio.name}
            currencies={companyCurrencies}
            adminUserId={user.id}
            onGrantSuccess={() => {
              setIsGrantingPass(false);
            }}
            onClose={() => setIsGrantingPass(false)}
          />
        )}
      </div>
    );
  }

  // --- SUBPAGE 1: BRAND MANAGEMENT SUBPAGE ---
  if (managingCompany) {
    const brandStudios = studios.filter(
      (s) => s.companyId === managingCompany.id || s.parentBrandCommunityId === managingCompany.id
    );

    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6 text-slate-900 dark:text-slate-100 animate-fadeIn">
        {/* Push / Pop Subpage Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <button
            type="button"
            onClick={() => setManagingCompany(null)}
            data-testid="brand-back-button"
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <span>←</span>
            <span>Back to My Brands</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Brand Owner
            </span>
          </div>
        </div>

        {/* Brand Overview Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>🏢</span>
              <span>{managingCompany.name}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {managingCompany.description || 'Parent Brand Network for Yoga Studios across London.'}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/60">
            <div>✉️ {managingCompany.contactEmail}</div>
            {managingCompany.website && <div>🌐 {managingCompany.website}</div>}
          </div>
        </div>

        {/* Tab Navigation Selector */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setBrandActiveTab('studios')}
            data-testid="brand-tab-studios"
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all ${
              brandActiveTab === 'studios'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🏢 Studio Branches ({brandStudios.length})
          </button>
          <button
            type="button"
            onClick={() => setBrandActiveTab('currencies')}
            data-testid="brand-tab-currencies"
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all ${
              brandActiveTab === 'currencies'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            💳 Brand Currencies &amp; Pricing ({companyCurrencies.length})
          </button>
          <button
            type="button"
            onClick={() => setBrandActiveTab('settings')}
            data-testid="brand-tab-settings"
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all ${
              brandActiveTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ⚙️ Brand Info &amp; Settings
          </button>
        </div>

        {/* TAB 1: STUDIOS */}
        {brandActiveTab === 'studios' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Network Locations</h2>
              <button
                type="button"
                onClick={() => setIsCreatingStudio(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                ＋ Add New Location
              </button>
            </div>

            {brandStudios.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                <div className="text-3xl">🧘</div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No Studios Assigned Yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Create a new location or assign existing independent studios to {managingCompany.name}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brandStudios.map((st) => (
                  <div
                    key={st.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{st.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            st.status === 'temp_closed'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : st.isClosed || st.status === 'closed'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {st.status === 'temp_closed'
                            ? 'Temp Closed'
                            : st.isClosed || st.status === 'closed'
                            ? 'Closed'
                            : 'Open & Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{st.address}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenManageModal(st)}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 transition"
                    >
                      Manage Location ⚙️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BRAND CURRENCIES */}
        {brandActiveTab === 'currencies' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Brand Currencies &amp; Passes</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pricing packages created here automatically apply to all location branches following brand policy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCurrency(true)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                >
                  ＋ Create Currency
                </button>
              </div>

              {/* Add Currency Form */}
              {isAddingCurrency && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-300">New Brand Currency Pass</h3>
                  <input
                    type="text"
                    placeholder="Pass Title e.g. 5-Class Summer Pack"
                    value={newCurrTitle}
                    onChange={(e) => setNewCurrTitle(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Description e.g. Valid across all brand studios"
                    value={newCurrDesc}
                    onChange={(e) => setNewCurrDesc(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Tier Type</label>
                      <select
                        value={newCurrTier}
                        onChange={(e) => setNewCurrTier(e.target.value as CurrencyTierType)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      >
                        <option value="drop_in">Single Drop-In</option>
                        <option value="credit_pack">Credit Pack</option>
                        <option value="unlimited">Unlimited Pass</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Base Price (£)</label>
                      <input
                        type="number"
                        value={newCurrPrice}
                        onChange={(e) => setNewCurrPrice(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Credit Count</label>
                      <input
                        type="number"
                        value={newCurrCredits}
                        onChange={(e) => setNewCurrCredits(Number(e.target.value))}
                        disabled={newCurrTier === 'unlimited'}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Lifespan (Days)</label>
                      <input
                        type="number"
                        value={newCurrValidity}
                        onChange={(e) => setNewCurrValidity(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCurrency(false)}
                      className="w-1/2 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                    >
                      ✕ Discard Changes
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCurrTitle) return;
                        try {
                          const currencyPayload: Omit<CompanyCurrency, 'id' | 'createdAt' | 'updatedAt'> = {
                            companyId: managingCompany.id,
                            title: newCurrTitle,
                            description: newCurrDesc || 'Brand Pass',
                            tierType: newCurrTier,
                            basePriceAmount: newCurrPrice,
                            currencySymbol: '£',
                            validityDays: newCurrValidity,
                            allowedStudioIds: 'all',
                          };
                          if (newCurrTier !== 'unlimited') {
                            currencyPayload.creditCount = newCurrCredits;
                          }

                          await firestoreService.createCompanyCurrency(currencyPayload);
                          setIsAddingCurrency(false);
                          setNewCurrTitle('');
                          setNewCurrDesc('');
                          const updated = await firestoreService.fetchCompanyCurrencies(managingCompany.id);
                          setCompanyCurrencies(updated);
                        } catch (err: unknown) {
                          console.error('[MyStudiosView] Failed to create brand currency:', err);
                          alert(err instanceof Error ? err.message : 'Failed to save currency.');
                        }
                      }}
                      className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Currency List */}
              {companyCurrencies.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">No brand currencies created yet.</div>
              ) : (
                <div className="space-y-3">
                  {companyCurrencies.map((curr) => {
                    if (editingCurrencyId === curr.id) {
                      return (
                        <div
                          key={curr.id}
                          className="p-4 bg-slate-100 dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Edit Brand Currency Package</h4>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {curr.id}</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Pass Title"
                            value={editCurrTitle}
                            onChange={(e) => setEditCurrTitle(e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={editCurrDesc}
                            onChange={(e) => setEditCurrDesc(e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Tier Type</label>
                              <select
                                value={editCurrTier}
                                onChange={(e) => setEditCurrTier(e.target.value as CurrencyTierType)}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                              >
                                <option value="drop_in">Single Drop-In</option>
                                <option value="credit_pack">Multi-Class Credit Pack</option>
                                <option value="unlimited">Unlimited Pass</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Base Price (£)</label>
                              <input
                                type="number"
                                value={editCurrPrice}
                                onChange={(e) => setEditCurrPrice(Number(e.target.value))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Credit Count</label>
                              <input
                                type="number"
                                value={editCurrCredits}
                                onChange={(e) => setEditCurrCredits(Number(e.target.value))}
                                disabled={editCurrTier === 'unlimited'}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Lifespan (Days)</label>
                              <input
                                type="number"
                                value={editCurrValidity}
                                onChange={(e) => setEditCurrValidity(Number(e.target.value))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingCurrencyId(null)}
                              className="w-1/2 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                            >
                              ✕ Discard Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditCurrency(curr.id)}
                              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                            >
                              ✓ Save Currency Changes
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={curr.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{curr.title}</h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              {curr.tierType === 'unlimited' ? 'Unlimited' : `${curr.creditCount} Credits`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{curr.description}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">£{curr.basePriceAmount}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{curr.validityDays} Days Lifespan</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEditCurrency(curr)}
                            data-testid={`brand-edit-currency-${curr.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95 flex items-center space-x-1"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BRAND SETTINGS */}
        {brandActiveTab === 'settings' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Brand Profile &amp; Contact Details</h2>

            {companyError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                ⚠️ {companyError}
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  placeholder="e.g. Affordable London Yoga"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editCompanyEmail}
                    onChange={(e) => setEditCompanyEmail(e.target.value)}
                    placeholder="contact@brand.co.uk"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={editCompanyWebsite}
                    onChange={(e) => setEditCompanyWebsite(e.target.value)}
                    placeholder="https://brand.co.uk"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brand Description</label>
                <textarea
                  value={editCompanyDescription}
                  onChange={(e) => setEditCompanyDescription(e.target.value)}
                  placeholder="Describe your studio network..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCompany}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSavingCompany ? 'Saving...' : 'Save Brand Info'}
              </button>
            </form>

            {/* Danger Zone: Delete Brand Network */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Delete Brand Network</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Unlinks studios and moves them to Independent Studios.</p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingCompany(managingCompany)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition"
              >
                🗑️ Delete Brand Network
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- ROOT VIEW: MY BRANDS & STUDIOS LIST ---
  const standaloneStudios = studios.filter((s) => !s.companyId);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-8 text-slate-900 dark:text-slate-100 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            data-testid="my-studios-back-button"
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <span>←</span>
            <span>{backLabel || 'Back'}</span>
          </button>
        )}

        <div className="text-right ml-auto">
          <div className="flex items-center space-x-2 justify-end">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Brands &amp; Studios</h1>
            {isLoading && <span className="animate-spin text-xs text-indigo-500">🌀</span>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage location profiles, currency passes, and member grants</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* SECTION 1: MY BRAND NETWORKS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <span>🏢</span>
            <span>My Brand Networks ({companies.length})</span>
          </h2>
        </div>

        {companies.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">No brand networks configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => {
              const compStudios = studios.filter((s) => s.companyId === comp.id);
              return (
                <div
                  key={comp.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xl"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{comp.name}</h3>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {compStudios.length} Locations
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {comp.description || 'Parent Brand Network'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCompanyModal(comp)}
                    data-testid={`manage-company-${comp.id}`}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                  >
                    Manage Brand &amp; Currencies ⚙️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: INDEPENDENT STUDIOS */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <span>🧘</span>
            <span>Independent Studios ({standaloneStudios.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsCreatingStudio(true)}
            data-testid="create-studio-button"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition"
          >
            ＋ Create New Studio
          </button>
        </div>

        {standaloneStudios.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">No independent studios registered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standaloneStudios.map((st) => (
              <div
                key={st.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{st.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        st.status === 'temp_closed'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : st.isClosed || st.status === 'closed'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {st.status === 'temp_closed'
                        ? 'Temp Closed'
                        : st.isClosed || st.status === 'closed'
                        ? 'Closed'
                        : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{st.address}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenManageModal(st)}
                  data-testid={`manage-studio-${st.id}`}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 transition"
                >
                  Manage Studio ⚙️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Company Modal Confirmation */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-center shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Brand Network?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deleting <strong>{deletingCompany.name}</strong> will move assigned studios to Independent Studios.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCompany}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md"
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
