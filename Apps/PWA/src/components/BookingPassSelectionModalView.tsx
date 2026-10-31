import React, { useState } from 'react';
import { UserPass } from '../types';
import { colorTokens } from '../theme/colorTokens';

interface BookingPassSelectionModalViewProps {
  classNameTitle: string;
  studioName: string;
  classDateString: string;
  startTime: string;
  acceptedCurrencyIds?: string[];
  currencyAcceptancePolicyMode?: string;
  userPasses: UserPass[];
  onConfirmBook: (selectedPassId: string) => void;
  onClose: () => void;
}

export const BookingPassSelectionModalView: React.FC<BookingPassSelectionModalViewProps> = ({
  classNameTitle,
  studioName,
  classDateString,
  startTime,
  acceptedCurrencyIds = [],
  currencyAcceptancePolicyMode = 'acceptAll',
  userPasses,
  onConfirmBook,
  onClose,
}) => {
  const isCustomRestricted = currencyAcceptancePolicyMode === 'customSelected' && acceptedCurrencyIds.length > 0;

  const activeValidPasses = userPasses.filter((p) => {
    if (p.status !== 'active') return false;
    if (p.expiresAt && new Date(p.expiresAt).getTime() < Date.now()) return false;
    if (p.tierType !== 'unlimited' && (!p.creditsRemaining || p.creditsRemaining <= 0)) return false;
    return true;
  });

  const eligiblePasses = isCustomRestricted
    ? activeValidPasses.filter((p) => acceptedCurrencyIds.includes(p.currencyId))
    : activeValidPasses;

  const [selectedPassId, setSelectedPassId] = useState<string>(
    eligiblePasses[0]?.id || ''
  );

  const isSelectedPassEligible = eligiblePasses.some((p) => p.id === selectedPassId);

  return (
    <div className={colorTokens.surfaces.backdrop}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="redeem-pass-modal-title"
        className={`${colorTokens.surfaces.modal} max-w-md w-full p-6 relative`}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <h3 id="redeem-pass-modal-title" className={`text-lg font-extrabold ${colorTokens.text.primary} flex items-center gap-2 mb-1`}>
          <span>🎟️</span> Redeem Pass &amp; Book
        </h3>
        <p className={`text-xs ${colorTokens.text.muted} mb-4`}>
          Select an active pass from your wallet to redeem 1 credit for this session.
        </p>

        {isCustomRestricted && eligiblePasses.length === 0 && (
          <div className={`p-3 mb-4 rounded-xl ${colorTokens.surfaces.amberNotice} text-xs`}>
            ⚠️ <strong>Restricted Class Passes:</strong> None of your active passes are accepted for this class. Studio policy requires a specific pass tier. Please purchase an accepted pass or book via drop-in.
          </div>
        )}

        <div className={`${colorTokens.surfaces.insetRounded} p-3 mb-4 text-xs space-y-1`}>
          <p className="font-extrabold text-indigo-700 dark:text-indigo-300">{classNameTitle}</p>
          <p className={colorTokens.text.muted}>{studioName}</p>
          <p className={`${colorTokens.text.subtle} font-medium`}>{classDateString} • {startTime}</p>
        </div>

        <div className="space-y-3 mb-6" role="radiogroup" aria-label="Available Passes in Wallet">
          <label className={colorTokens.inputs.label}>Available Passes in Wallet</label>
          {activeValidPasses.map((pass) => {
            const isEligible = !isCustomRestricted || acceptedCurrencyIds.includes(pass.currencyId);
            const isSelected = selectedPassId === pass.id;
            return (
              <div
                key={pass.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isEligible ? 0 : -1}
                onKeyDown={(e) => {
                  if (isEligible && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setSelectedPassId(pass.id);
                  }
                }}
                onClick={() => {
                  if (isEligible) setSelectedPassId(pass.id);
                }}
                className={`p-3 rounded-xl border transition flex items-center justify-between ${
                  !isEligible
                    ? 'opacity-50 bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 dark:bg-indigo-950/40 dark:border-indigo-500 dark:ring-indigo-500/50 cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:border-slate-600 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      !isEligible
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900'
                        : isSelected
                        ? 'border-indigo-500 bg-indigo-600'
                        : 'border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {isSelected && isEligible && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-extrabold ${colorTokens.text.primary}`}>{pass.currencyTitle}</p>
                      {!isEligible && (
                        <span className={`px-1.5 py-0.5 rounded ${colorTokens.badges.rose} text-[9px] font-bold`}>
                          ⚠️ Ineligible for this class
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ${colorTokens.text.muted}`}>
                      {pass.tierType === 'unlimited'
                        ? 'Unlimited Pass'
                        : `${pass.creditsRemaining} credit(s) remaining`}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] ${colorTokens.text.subtle} font-bold`}>
                  Exp: {new Date(pass.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>

        <div className={`flex gap-3 pt-2 ${colorTokens.borders.dividerTop}`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 ${colorTokens.buttons.secondaryText} font-bold text-xs rounded-xl transition`}
          >
            Cancel
          </button>
          <button
            disabled={!selectedPassId || !isSelectedPassEligible}
            onClick={() => onConfirmBook(selectedPassId)}
            data-testid="confirm-booking-pass-button"
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};
