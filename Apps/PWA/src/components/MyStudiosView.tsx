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

  // In-App Hard Delete Studio Confirmation State
  const [hardDeletingStudio, setHardDeletingStudio] = useState<YogaStudio | null>(null);

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
  const [isGrantingPass, setIsGrantingPass] = useState<boolean>(false);

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

      if (fetchedCompanies && fetchedCompanies.length > 0) {
        const currencies = await firestoreService.fetchCompanyCurrencies(fetchedCompanies[0].id);
        setCompanyCurrencies(currencies);
      }
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

  const handleOpenManageModal = async (st: YogaStudio) => {
    setManagingCompany(null);
    setManagingStudio(st);
    setBioText(st.about || '');
    setStudioActiveTab('general');

    try {
      const policy = await firestoreService.fetchStudioCurrencyPolicy(st.id);
      setStudioPolicy(policy);
    } catch {
      setStudioPolicy(null);
    }
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
                            st.isClosed
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {st.isClosed ? 'Closed' : 'Open & Active'}
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
                  {companyCurrencies.map((curr) => (
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
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">£{curr.basePriceAmount}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{curr.validityDays} Days Lifespan</div>
                      </div>
                    </div>
                  ))}
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

  // --- SUBPAGE 2: STUDIO LOCATION MANAGEMENT SUBPAGE ---
  if (managingStudio) {
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
            <span>Back to My Studios</span>
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
                managingStudio.isClosed
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {managingStudio.isClosed ? 'Closed' : 'Verified Owner ✓'}
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

            {/* Danger Zone: Delete Studio */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Permanently Delete Location</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Remove studio record from platform.</p>
              </div>
              <button
                type="button"
                onClick={() => setHardDeletingStudio(managingStudio)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition"
              >
                🗑️ Delete Studio
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING & CURRENCY POLICY */}
        {studioActiveTab === 'pricing' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Currency Acceptance Policy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose whether this location follows parent brand pricing or uses a custom override.
              </p>
            </div>

            {/* Policy Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={async () => {
                  if (!managingStudio.companyId) return;
                  await firestoreService.saveStudioCurrencyPolicy({
                    studioId: managingStudio.id,
                    companyId: managingStudio.companyId,
                    policyMode: 'follow_brand',
                    acceptedCurrencyIds: [],
                    updatedAt: new Date().toISOString(),
                  });
                  setStudioPolicy({
                    studioId: managingStudio.id,
                    companyId: managingStudio.companyId,
                    policyMode: 'follow_brand',
                    acceptedCurrencyIds: [],
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className={`p-4 rounded-2xl border text-left space-y-2 transition ${
                  studioPolicy?.policyMode === 'follow_brand' || !studioPolicy
                    ? 'bg-indigo-500/10 border-indigo-500 text-slate-900 dark:text-white shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">🏛️ Follow Brand Pricing</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accepts all credit packs &amp; passes issued by parent brand.
                </p>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await firestoreService.saveStudioCurrencyPolicy({
                    studioId: managingStudio.id,
                    companyId: managingStudio.companyId,
                    policyMode: 'custom_override',
                    acceptedCurrencyIds: [],
                    updatedAt: new Date().toISOString(),
                  });
                  setStudioPolicy({
                    studioId: managingStudio.id,
                    companyId: managingStudio.companyId,
                    policyMode: 'custom_override',
                    acceptedCurrencyIds: [],
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className={`p-4 rounded-2xl border text-left space-y-2 transition ${
                  studioPolicy?.policyMode === 'custom_override'
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
          </div>
        )}

        {/* Admin Pass Granting Modal */}
        {isGrantingPass && user && (
          <AdminGrantPassModalView
            studioId={managingStudio.id}
            studioName={managingStudio.name}
            currencies={companyCurrencies}
            adminUserId={user.id}
            onGrantSuccess={() => {
              setIsGrantingPass(false);
              alert('Pass granted and deposited directly into recipient wallet!');
            }}
            onClose={() => setIsGrantingPass(false)}
          />
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
                        st.isClosed
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {st.isClosed ? 'Closed' : 'Active'}
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

      {/* Hard Delete Studio Modal Confirmation */}
      {hardDeletingStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-center shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Permanently Delete Studio?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to permanently delete <strong>{hardDeletingStudio.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setHardDeletingStudio(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHardDeleteStudio}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                🗑️ Confirm Delete Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
