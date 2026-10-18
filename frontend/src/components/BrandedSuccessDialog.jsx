import { CheckCircle2 } from 'lucide-react';

const BrandedSuccessDialog = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="lifetrack-success-title"
        aria-modal="true"
        className="w-full max-w-md space-y-5 rounded-2xl border-2 border-[#5A1827] bg-[#FAF9F6] p-6 font-sans text-[#5A1827] shadow-2xl"
        role="alertdialog"
      >
        <div className="flex items-center gap-3 border-b-2 border-[#5A1827]/15 pb-3">
          <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-emerald-700" />
          <h2 className="text-lg font-black" id="lifetrack-success-title">LifeTrack</h2>
        </div>
        <p className="text-sm font-medium text-slate-700">{message}</p>
        <div className="flex justify-end">
          <button
            autoFocus
            className="rounded-xl border border-[#E5C158]/50 bg-[#5A1827] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#E5C158] shadow-md transition hover:bg-[#3D101A]"
            onClick={onClose}
            type="button"
          >
            OK
          </button>
        </div>
      </section>
    </div>
  );
};

export default BrandedSuccessDialog;
