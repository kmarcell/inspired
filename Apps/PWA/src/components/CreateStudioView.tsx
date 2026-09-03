import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Company } from '../types';

interface CreateStudioViewProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateStudioView: React.FC<CreateStudioViewProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();

  const [existingCompanies, setExistingCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('new'); // 'none' | 'new' | companyId
  const [isLoadingCompanies, setIsLoadingCompanies] = useState<boolean>(true);

  // Company Form State
  const [companyName, setCompanyName] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyWebsite, setCompanyWebsite] = useState<string>('');
  const [companyDescription, setCompanyDescription] = useState<string>('');
  const [companyBannerUrl, setCompanyBannerUrl] = useState<string>('');
  const [companyLogoUrl, _setCompanyLogoUrl] = useState<string>('');

  // Studio Form State
  const [studioName, setStudioName] = useState<string>('');
  const [locationPrefix, setLocationPrefix] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [about, setAbout] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [logoUrl, _setLogoUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadOwnerCompanies = async () => {
      if (!user) return;
      setIsLoadingCompanies(true);
      try {
        const companies = await firestoreService.fetchCompaniesByOwner(user.id);
        setExistingCompanies(companies);
        if (companies.length > 0) {
          setSelectedCompanyId(companies[0].id);
        } else {
          setSelectedCompanyId('new');
        }
      } catch (err) {
        console.error('[CreateStudioView] Failed to load companies:', err);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadOwnerCompanies();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || successMessage || !user) return;

    setError(null);
    setSuccessMessage(null);

    // Basic Validation
    if (!studioName.trim()) {
      setError('Please enter a studio name.');
      return;
    }
    if (!locationPrefix.trim()) {
      setError('Please enter a valid postcode outward code (e.g. W12, W6, SW3).');
      return;
    }
    if (!address.trim()) {
      setError('Please enter a full business address.');
      return;
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (selectedCompanyId === 'new') {
      if (!companyName.trim()) {
        setError('Please enter your Company Brand name.');
        return;
      }
      if (!companyEmail.trim() || !EMAIL_REGEX.test(companyEmail.trim())) {
        setError('Please enter a valid company contact email (e.g. contact@zensanctuary.co.uk).');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let finalCompanyId: string | undefined = undefined;

      if (selectedCompanyId === 'new') {
        const newCompany = await firestoreService.createCompany(user.id, {
          name: companyName,
          contactEmail: companyEmail,
          website: companyWebsite,
          description: companyDescription || `${companyName} Yoga Brand`,
          bannerImageUrl: companyBannerUrl,
          logoUrl: companyLogoUrl,
        });
        finalCompanyId = newCompany.id;
      } else if (selectedCompanyId !== 'none') {
        finalCompanyId = selectedCompanyId;
      }

      await firestoreService.createStudio(user.id, {
        name: studioName,
        address,
        location_prefix: locationPrefix.toUpperCase(),
        about,
        companyId: finalCompanyId,
        userEmail: user.username || `${user.id}@inspired.test`,
        contactEmail: contactEmail || companyEmail || user.username || `${user.id}@inspired.test`,
        contactPhone,
        websiteUrl: websiteUrl || companyWebsite,
        coverImageUrl,
        logoUrl,
      });

      setSuccessMessage('Studio and Brand profile submitted for verification! 📩 Pending Admin Approval.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error('[CreateStudioView] Creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create studio profile.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={onClose}
        data-testid="create-studio-back-button"
        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {/* Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-1 backdrop-blur-md">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <span>🏢</span>
          <span>Create Studio &amp; Brand</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          List your physical studio location or expand your multi-branch company network on Inspired.
        </p>
      </div>

      {/* Form Feedbacks */}
      {error && (
        <div data-testid="create-studio-error" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div data-testid="create-studio-success" className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          {successMessage}
        </div>
      )}

      {/* Create Studio Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-6">
        {/* Step 1: Company Affiliation */}
        <div className="space-y-3">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 1: Company / Parent Brand
          </label>

          {isLoadingCompanies ? (
            <div className="text-xs text-slate-400">Loading company brands...</div>
          ) : (
            <select
              data-testid="select-company-id"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="new">＋ Create New Company Brand</option>
              <option value="none">Independent Studio (No Parent Brand)</option>
              {existingCompanies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  🏢 {comp.name} (Existing Brand)
                </option>
              ))}
            </select>
          )}

          {/* New Company Brand Fields */}
          {selectedCompanyId === 'new' && (
            <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Brand Name *
                </label>
                <input
                  type="text"
                  data-testid="input-company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Zen Sanctuary Group"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business Contact Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    data-testid="input-company-email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g. contact@zensanctuary.co.uk"
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {companyEmail && (
                    <button
                      type="button"
                      onClick={() => setCompanyEmail('')}
                      data-testid="clear-company-email-button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] font-bold flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  data-testid="input-company-website"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="e.g. https://zensanctuary.co.uk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Banner Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  data-testid="input-company-banner"
                  value={companyBannerUrl}
                  onChange={(e) => setCompanyBannerUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/photo-1545205597-3d9d02c29597"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Description
                </label>
                <textarea
                  data-testid="input-company-description"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Boutique hot vinyasa and restorative yoga sanctuaries..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Studio Location Details */}
        <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 2: Studio Location Details
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Studio Location Name *
            </label>
            <input
              type="text"
              data-testid="input-studio-name"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="e.g. Askew Road Zen Den"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Postcode Outward Code (Prefix) *
            </label>
            <input
              type="text"
              data-testid="input-studio-prefix"
              value={locationPrefix}
              onChange={(e) => setLocationPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. W12, W6, SW3, NW1"
              maxLength={4}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Determines proximity matching for local students in Search &amp; Feed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Business Address *
            </label>
            <input
              type="text"
              data-testid="input-studio-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Askew Rd, London W12 9AU"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Additional Contact & Media Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Studio Direct Contact Email (Optional)
              </label>
              <input
                type="email"
                data-testid="input-studio-contact-email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. hello@askewzen.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Studio Contact Phone (Optional)
              </label>
              <input
                type="tel"
                data-testid="input-studio-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +44 20 7946 0912"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Studio Website URL (Optional)
            </label>
            <input
              type="url"
              data-testid="input-studio-website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. https://askewzen.com"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Studio Cover Banner Image URL (Optional)
            </label>
            <input
              type="url"
              data-testid="input-studio-cover-url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/photo-1545205597-3d9d02c29597"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              About Studio (Bio / Class Offerings)
            </label>
            <textarea
              data-testid="input-studio-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="e.g. Hot Vinyasa, Yin, and Sound Baths in a sunlit sanctuary..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          data-testid="submit-create-studio-button"
          disabled={isSubmitting || !!successMessage}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting
            ? '⏳ Creating Studio & Submitting Verification...'
            : successMessage
            ? '✓ Submitted! Redirecting...'
            : '✨ Create Studio & Claim Profile'}
        </button>
      </form>
    </div>
  );
};
