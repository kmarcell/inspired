import React, { useState } from 'react';
import { CompanyCurrency } from '../types';
import { firestoreService } from '../services/firestoreService';

interface CurrencyStoreCheckoutModalViewProps {
  studioName: string;
  currencies: CompanyCurrency[];
  userId: string;
  onPassActivated: () => void;
  onClose: () => void;
}

export const CurrencyStoreCheckoutModalView: React.FC<CurrencyStoreCheckoutModalViewProps> = ({
  studioName,
  currencies,
  userId,
  onPassActivated,
  onClose,
}) => {
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>(
    currencies[0]?.id || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const selectedCurrency = currencies.find((c) => c.id === selectedCurrencyId) || currencies[0];

  const handlePayAndActivate = async () => {
    if (!selectedCurrency) return;

    // Environment Security & Execution Rules
    const isDevMode = import.meta.env.DEV;
    const mode = import.meta.env.MODE;

    if (mode === 'production') {
      setNoticeMessage('Online payment integration coming soon in production.');
      return;
    }

    if (mode === 'staging') {
      setNoticeMessage('Direct purchasing is disabled on Staging for safety. Please contact your studio admin to grant test passes.');
      return;
    }

    // Local Dev Mode execution
    if (isDevMode) {
      setIsProcessing(true);
      try {
        await firestoreService.grantUserPass({
          userId,
          currencyId: selectedCurrency.id,
          currencyTitle: selectedCurrency.title,
          studioId: selectedCurrency.studioId,
          companyId: selectedCurrency.companyId,
          tierType: selectedCurrency.tierType,
          totalCredits: selectedCurrency.creditCount,
          creditsRemaining: selectedCurrency.creditCount,
          unlimitedPeriod: selectedCurrency.unlimitedPeriod,
          validityDays: selectedCurrency.validityDays,
          grantNote: 'Local Dev Auto-Activated Test Purchase',
        });
        setIsProcessing(false);
        onPassActivated();
      } catch (err) {
        setIsProcessing(false);
        setNoticeMessage(err instanceof Error ? err.message : 'Failed to activate pass');
      }
    }
  };

  const finalPrice = selectedCurrency?.promoOffer
    ? selectedCurrency.basePriceAmount * (1 - selectedCurrency.promoOffer.promoDiscountPercent / 100)
    : selectedCurrency?.basePriceAmount || 0;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <h3 className="text-xl font-extrabold text-white mb-1 flex items-center gap-2">
          <span>💳</span> Purchase Studio Pass
        </h3>
        <p className="text-xs text-slate-400 mb-6">{studioName}</p>

        {noticeMessage && (
          <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-semibold">
            ⚠️ {noticeMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Catalog Options */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Pass Tier</h4>
            {currencies.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No currencies available for this studio.</p>
            ) : (
              currencies.map((curr) => {
                const isSelected = selectedCurrencyId === curr.id;
                const hasPromo = !!curr.promoOffer;
                const promoPrice = hasPromo
                  ? curr.basePriceAmount * (1 - curr.promoOffer!.promoDiscountPercent / 100)
                  : curr.basePriceAmount;

                return (
                  <div
                    key={curr.id}
                    onClick={() => setSelectedCurrencyId(curr.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition relative ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-500 bg-slate-900'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-extrabold text-sm text-white">{curr.title}</span>
                      </div>
                      {hasPromo && (
                        <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 font-extrabold text-[10px] rounded-md">
                          🔥 {curr.promoOffer?.promoDiscountPercent}% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 ml-6">{curr.description}</p>
                    <div className="text-xs font-bold text-slate-200 mt-2 ml-6">
                      {curr.currencySymbol}
                      {promoPrice.toFixed(2)}{' '}
                      {hasPromo && (
                        <span className="text-slate-500 line-through text-[11px] font-normal ml-1">
                          {curr.currencySymbol}
                          {curr.basePriceAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Summary Panel */}
          <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Order Summary</h4>
              {selectedCurrency ? (
                <div className="text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Selected Item:</span>
                    <span className="font-bold text-white text-right">{selectedCurrency.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Price:</span>
                    <span>{selectedCurrency.currencySymbol}{selectedCurrency.basePriceAmount.toFixed(2)}</span>
                  </div>
                  {selectedCurrency.promoOffer && (
                    <div className="flex justify-between text-pink-400">
                      <span>Promo Discount:</span>
                      <span>-{selectedCurrency.promoOffer.promoDiscountPercent}%</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-extrabold text-sm text-emerald-400">
                    <span>Total Due:</span>
                    <span>{selectedCurrency.currencySymbol}{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No item selected</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
              <p>By purchasing, you agree to our</p>
              <div className="flex gap-2 font-medium">
                <a href="#terms" className="text-indigo-400 underline hover:text-indigo-300">Terms &amp; Conditions</a>
                <span>and</span>
                <a href="#privacy" className="text-indigo-400 underline hover:text-indigo-300">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            disabled={!selectedCurrency || isProcessing}
            onClick={handlePayAndActivate}
            className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>🔒</span> {isProcessing ? 'Activating...' : `Pay ${selectedCurrency?.currencySymbol || ''}${finalPrice.toFixed(2)} & Activate Pass`}
          </button>
        </div>
      </div>
    </div>
  );
};
