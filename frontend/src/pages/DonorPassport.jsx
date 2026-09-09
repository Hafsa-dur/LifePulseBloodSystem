import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { ShieldCheck, Download, History } from 'lucide-react';

const DonorPassport = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const passportRef = useRef(null);

  const handleDownload = async () => {
    if (passportRef.current) {
      const canvas = await html2canvas(passportRef.current, { scale: 3, useCORS: true });
      const link = document.createElement('a');
      link.download = `${user.name || 'Donor'}_QR_Passport.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#5A1827] py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6 flex flex-col items-center">
        
        {/* 🌟 Luxury Cream & Maroon Passport Container */}
        <div 
          ref={passportRef}
          className="relative w-full rounded-3xl p-8 border-2 border-[#6B1D2F]/30 
                     bg-gradient-to-br from-white via-[#FAF9F6] to-rose-50/40 
                     shadow-xl shadow-rose-950/5 
                     flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-rose-200/50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none"></div>

          {/* Passport Title Header */}
          <div className="text-center mb-6 relative z-10">
            <span className="px-3 py-1 bg-rose-100 border border-rose-300 text-[#990000] font-black text-xs rounded-xl uppercase tracking-wider shadow-sm">
              Digital Identity Passport
            </span>
            <h2 className="text-xl font-black text-[#5A1827] tracking-tight mt-3">
              Blood Life Pulse
            </h2>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              Verified Donor: <span className="text-[#990000]">{user.name || 'Aqsa'}</span>
            </p>
          </div>

          {/* Clean QR Code Container with Frame */}
          <div className="relative z-10 p-5 rounded-2xl bg-white shadow-md border-2 border-[#6B1D2F]/20">
            <QRCodeSVG 
              value={JSON.stringify({ 
                id: user.donorId || 'LP-DONOR-882', 
                name: user.name || 'Aqsa',
                bloodGroup: user.bloodGroup || 'A+'
              })} 
              size={180}
              fgColor="#5A1827"
            />
          </div>

          {/* Passport Footer Badge */}
          <div className="mt-6 relative z-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black uppercase text-amber-950 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] border border-[#D97706] shadow-sm">
              <ShieldCheck className="w-4 h-4" /> Official QR Pass
            </span>
          </div>
        </div>

        {/* Download Action Button (Tight Golden / Maroon Theme) */}
        <button 
          onClick={handleDownload} 
          className="w-full py-4 bg-[#5A1827] hover:bg-[#4A121F] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-rose-950/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-[#6B1D2F]"
        >
          <Download className="w-4 h-4 text-[#E5C158]" /> Download QR Passport
        </button>
      </div>
    </div>
  );
};

export default DonorPassport;