import React, { useState } from 'react';
import { UserPass } from '../types';

interface BookingPassSelectionModalViewProps {
  classNameTitle: string;
  studioName: string;
  classDateString: string;
  startTime: string;
  userPasses: UserPass[];
  onConfirmBook: (selectedPassId: string) => void;
  onClose: () => void;
}

export const BookingPassSelectionModalView: React.FC<BookingPassSelectionModalViewProps> = ({
  classNameTitle,
  studioName,
  classDateString,
  startTime,
  userPasses,
  onConfirmBook,
  onClose,
}) => {
  const activeValidPasses = userPasses.filter(
    (p) => p.status === 'active' && (p.tierType === 'unlimited' || (p.creditsRemaining && p.creditsRemaining > 0))
  );

  const [selectedPassId, setSelectedPassId] = useState<string>(
    activeValidPasses[0]?.id || ''
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-1">
          <span>🎟️</span> Redeem Pass &amp; Book
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Select an active pass from your wallet to redeem 1 credit for this session.
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 text-xs space-y-1">
          <p className="font-extrabold text-indigo-300">{classNameTitle}</p>
          <p className="text-slate-400">{studioName}</p>
          <p className="text-slate-500 font-medium">{classDateString} • {startTime}</p>
        </div>

        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-slate-300 block">Available Passes in Wallet</label>
          {activeValidPasses.map((pass) => {
            const isSelected = selectedPassId === pass.id;
            return (
              <div
                key={pass.id}
                onClick={() => setSelectedPassId(pass.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-950/40 stroke-indigo-500 border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-500 bg-slate-900'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white">{pass.currencyTitle}</p>
                    <p className="text-[11px] text-slate-400">
                      {pass.tierType === 'unlimited'
                        ? 'Unlimited Pass'
                        : `${pass.creditsRemaining} credit(s) remaining`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-bold">
                  Exp: {new Date(pass.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            disabled={!selectedPassId}
            onClick={() => onConfirmBook(selectedPassId)}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};
