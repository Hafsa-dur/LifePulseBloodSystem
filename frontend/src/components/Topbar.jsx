import React from 'react';

const Topbar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'donor';
  const userName = user.name || (userRole === 'admin' ? 'Hafsa Sohail' : 'Aqsa');
  const userEmail = user.email || `${userName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

  const avatarInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-[#5A1827] border-b-2 border-[#E5C158]/30 text-white font-sans shadow-md sticky top-0 z-30 w-full">
      {/* Search Bar */}
      <div className="w-1/3">
        <input
          type="text"
          placeholder="Search donors, inventory..."
          className="w-full bg-[#4A121F] border-2 border-[#E5C158]/40 text-xs rounded-xl px-4 py-2.5 text-white font-bold placeholder:text-rose-300/60 focus:outline-none focus:border-[#E5C158] shadow-inner transition-all"
        />
      </div>

      {/* Right Side: Role Badge & Profile */}
      <div className="flex items-center gap-4">
        {/* Dynamic Badge: Admin ki jagah ab 'Admin' aur Donor ke liye 'Donor' show hoga */}
        <span
          className="px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full border shadow-sm bg-[#E5C158] text-[#5A1827] border-amber-400"
        >
          {userRole === 'admin' ? 'Admin' : 'Donor'}
        </span>

        {/* User Avatar & Information */}
        <div className="flex items-center gap-3 bg-[#4A121F] px-3 py-1.5 rounded-2xl border-2 border-[#E5C158]/30 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E5C158] to-amber-300 text-[#5A1827] font-black flex items-center justify-center text-xs shadow-md border border-white/20">
            {avatarInitial}
          </div>
          <div className="text-left text-xs pr-2">
            <p className="font-black text-white">{userName}</p>
            <p className="text-rose-200 text-[10px] font-semibold">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;