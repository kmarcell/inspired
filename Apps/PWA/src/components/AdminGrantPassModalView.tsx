import React, { useState } from 'react';
import { CompanyCurrency } from '../types';
import { firestoreService } from '../services/firestoreService';

interface AdminGrantPassModalViewProps {
  studioId: string;
  studioName: string;
  currencies: CompanyCurrency[];
  adminUserId: string;
  onGrantSuccess: () => void;
  onClose: () => void;
}

export const AdminGrantPassModalView: React.FC<AdminGrantPassModalViewProps> = ({
  studioId,
  studioName,
  currencies,
  adminUserId,
  onGrantSuccess,
  onClose,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>(currencies[0]?.id || 'custom');
  const [creditCount, setCreditCount] = useState<number>(2);
  const [grantNote, setGrantNote] = useState<string>('Cash Payment Recorded (£20 front desk sale)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCurrency = currencies.find((c) => c.id === selectedCurrencyId);

  const handleGrant = async () => {
    const targetUid = recipientUserId.trim() || recipientEmail.trim();
    if (!targetUid) {
      setErrorMsg('Please enter a recipient Member ID or email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await firestoreService.grantUserPass({
        userId: targetUid,
        currencyId: selectedCurrency?.id || 'custom_credit_grant',
        currencyTitle: selectedCurrency?.title || `Custom ${creditCount}-Credit Grant`,
        studioId,
        companyId: selectedCurrency?.companyId,
        tierType: selectedCurrency?.tierType || 'credit_pack',
        totalCredits: creditCount,
        creditsRemaining: creditCount,
        validityDays: selectedCurrency?.validityDays || 60,
        grantedByAdminId: adminUserId,
        grantNote,
      });

      setIsSubmitting(false);
      onGrantSuccess();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to grant pass.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <h3 className="text-xl font-extrabold text-white mb-1 flex items-center gap-2">
          <span>🎁</span> Grant Pass &amp; Credits to Member
        </h3>
        <p className="text-xs text-slate-400 mb-5">{studioName} • Front-Desk POS Suite</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Member ID / Email */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Recipient Member ID / Email</label>
            <input
              type="text"
              placeholder="e.g. elena@inspiredyoga.app or user UID"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value);
                setRecipientUserId(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Pass Tier / Currency Select */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Select Currency / Pass Tier</label>
            <select
              value={selectedCurrencyId}
              onChange={(e) => {
                setSelectedCurrencyId(e.target.value);
                const found = currencies.find((c) => c.id === e.target.value);
                if (found && found.creditCount) {
                  setCreditCount(found.creditCount);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="custom">Custom Credit Top-Up (Flexible Quantity)</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.tierType === 'unlimited' ? 'Unlimited' : `${c.creditCount || 1} Credits`})
                </option>
              ))}
            </select>
          </div>

          {/* Credit Count Stepper Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Credit Quantity to Grant</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={() => setCreditCount((prev) => Math.max(1, prev - 1))}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm rounded-lg transition"
                >
                  −
                </button>
                <span className="w-10 text-center font-extrabold text-sm text-emerald-400">{creditCount}</span>
                <button
                  type="button"
                  onClick={() => setCreditCount((prev) => prev + 1)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm rounded-lg transition"
                >
                  ＋
                </button>
              </div>
              <span className="text-xs text-slate-400 font-medium">Credits (Valid 60 Days)</span>
            </div>
          </div>

          {/* Payment Rationale / Note */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Payment Method / Note</label>
            <input
              type="text"
              placeholder="e.g. Cash Payment Recorded (£20 front desk sale)"
              value={grantNote}
              onChange={(e) => setGrantNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleGrant}
            className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>🎁</span> {isSubmitting ? 'Granting...' : `Grant ${creditCount} Credit(s) & Deposit`}
          </button>
        </div>
      </div>
    </div>
  );
};
