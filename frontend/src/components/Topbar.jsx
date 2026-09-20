import { Menu, Search, Landmark } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const Topbar = ({ onMenuClick = () => {} }) => {
  const { toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = String(user.role || 'donor').trim().toLowerCase();
  const normalizedRole = userRole === 'hospital_admin' || userRole === 'admin' ? 'hospital_admin' : userRole === 'hospital_staff' || userRole === 'staff' ? 'hospital_staff' : 'donor';
  const userName = user.name || (normalizedRole === 'hospital_admin' || normalizedRole === 'hospital_staff' ? 'Hospital Team Member' : 'Aqsa');
  const userEmail = user.email || `${userName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

  const avatarInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="topbar-responsive flex justify-between items-center px-6 py-4 bg-[#5A1827] border-b-2 border-[#E5C158]/30 text-white font-sans shadow-md sticky top-0 z-30 w-full">
      <div className="topbar-search-row">
        <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </button>
        <label className="topbar-search relative">
          <Search className="topbar-search-icon" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search inventory"
            placeholder="Search inventory..."
            className="w-full bg-[#4A121F] border-2 border-[#E5C158]/40 text-xs rounded-xl pl-10 pr-4 py-2.5 text-white font-bold placeholder:text-rose-300/60 focus:outline-none focus:border-[#E5C158] shadow-inner transition-all"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={toggleTheme} title="Change Dashboard Theme" aria-label="Change Dashboard Theme" className="theme-toggle flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5C158]/50 text-[#E5C158] hover:bg-[#E5C158]/15">
          <Landmark className="h-4 w-4" />
        </button>
        <div className="topbar-profile flex items-center gap-3 bg-[#4A121F] px-3 py-1.5 rounded-2xl border-2 border-[#E5C158]/30 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E5C158] to-amber-300 text-[#5A1827] font-black flex items-center justify-center text-xs shadow-md border border-white/20">
            {avatarInitial}
          </div>
          <div className="topbar-user-details text-left text-xs pr-2">
            <p className="font-black text-white">{userName}</p>
            <div className="topbar-email-row">
              <p className="text-rose-200 text-[10px] font-semibold">{userEmail}</p>
              <span className="topbar-role px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border shadow-sm bg-[#E5C158] text-[#5A1827] border-amber-400">
                {normalizedRole === 'hospital_admin' ? 'Admin' : normalizedRole === 'hospital_staff' ? (user.staffRole || 'Staff') : 'Donor'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;