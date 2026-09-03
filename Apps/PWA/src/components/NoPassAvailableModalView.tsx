import React from 'react';

interface NoPassAvailableModalViewProps {
  studioName: string;
  classNameTitle: string;
  onPurchasePassClick: () => void;
  onClose: () => void;
}

export const NoPassAvailableModalView: React.FC<NoPassAvailableModalViewProps> = ({
  studioName,
  classNameTitle,
  onPurchasePassClick,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-100 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>

        <h3 className="text-lg font-extrabold text-white mb-1">No Valid Pass Available</h3>
        <p className="text-xs text-amber-400 font-bold mb-3">Insufficient Credits</p>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          You don't hold any active passes or credits accepted by <strong className="text-white">{studioName}</strong> for <span className="text-indigo-300 font-semibold">{classNameTitle}</span>. Purchase a drop-in or credit pack to complete your booking.
        </p>

        <div className="space-y-2">
          <button
            onClick={onPurchasePassClick}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>💳</span> Purchase Pass ➔
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
