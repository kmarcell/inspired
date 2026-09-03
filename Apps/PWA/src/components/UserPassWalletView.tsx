import React, { useEffect, useState } from 'react';
import { UserPass } from '../types';
import { firestoreService } from '../services/firestoreService';

interface UserPassWalletViewProps {
  userId: string;
  onPurchaseClick?: () => void;
}

export const UserPassWalletView: React.FC<UserPassWalletViewProps> = ({ userId, onPurchaseClick }) => {
  const [passes, setPasses] = useState<UserPass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    firestoreService.fetchUserPasses(userId).then((fetched) => {
      if (isMounted) {
        setPasses(fetched);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [userId]);

  const activePasses = passes.filter((p) => p.status === 'active');
  const inactivePasses = passes.filter((p) => p.status !== 'active');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 max-w-4xl mx-auto my-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🎟️</span> My Digital Pass Wallet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your active credit balances, unlimited passes, and expiration dates across studios.
          </p>
        </div>
        {onPurchaseClick && (
          <button
            onClick={onPurchaseClick}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            💳 Purchase New Pass
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 text-xs">Loading passes...</div>
      ) : passes.length === 0 ? (
        <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800/80 p-6">
          <div className="text-3xl mb-2">🎫</div>
          <p className="text-sm font-bold text-slate-300">No Active Passes Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You don't hold any passes or credits yet. Browse studio class schedules to purchase drop-ins or multi-class packs.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Passes Section */}
          <div>
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
              Active Passes ({activePasses.length})
            </h3>
            {activePasses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No currently active passes.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activePasses.map((pass) => (
                  <div
                    key={pass.id}
                    className="bg-slate-800/90 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 transition shadow-md relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-extrabold text-sm text-white pr-2">{pass.currencyTitle}</h4>
                      <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold rounded-md">
                        ACTIVE
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 mb-3">
                      {pass.tierType === 'unlimited' ? (
                        <p className="font-bold text-indigo-300">♾️ Unlimited {pass.unlimitedPeriod || 'Monthly'} Pass</p>
                      ) : (
                        <p className="font-bold text-amber-400 text-sm">
                          {pass.creditsRemaining} / {pass.totalCredits || pass.creditsRemaining} Credits Remaining
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Expires: {new Date(pass.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    {pass.grantNote && (
                      <p className="text-[10px] text-slate-500 border-t border-slate-700/60 pt-2 italic">
                        Note: {pass.grantNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expired/Exhausted Passes Section */}
          {inactivePasses.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Past &amp; Exhausted Passes ({inactivePasses.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
                {inactivePasses.map((pass) => (
                  <div key={pass.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-300">{pass.currencyTitle}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded">
                        {pass.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Expired on {new Date(pass.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
