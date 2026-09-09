import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Droplets, 
  History, 
  QrCode, 
  User, 
  LogOut,
  Radio,
  Activity,
  GitPullRequest,
  Hospital,
  ClipboardList,
  Truck,
  Award,      
  HeartHandshake 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  // Retrieve user details from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'donor'; 

  // Handle user logout action and clear storage
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Define sidebar menu items based on user role (admin vs donor)
  const getMenuItems = () => {
    if (userRole === 'admin') {
      return [
        { path: '/dashboard', label: 'System Overview', icon: LayoutDashboard },
        { path: '/add-blood', label: 'Blood Inventory', icon: PlusCircle },
        { path: '/blood-list', label: 'Stock Directory', icon: Droplets },
        { path: '/donor-recipient-dispatch-log', label: 'Dispatch Log', icon: ClipboardList },
        { path: '/tracking', label: 'Live Transport Tracking', icon: Truck },
        { path: '/profile', label: 'Account Center', icon: User },
        { path: '/geopulse-radar', label: 'Location Intelligence', icon: Radio },
        { path: '/trauma-network', label: 'Emergency Network', icon: Activity },
        { path: '/patient-requests', label: 'Patient Requests', icon: GitPullRequest },
        { path: '/hospital-request', label: 'Hospital Request', icon: Hospital },
      ];
    } else {
      // Donor Portal Menu Items (Updated with Life Impact Board)
      return [
        { path: '/history', label: 'My Donations', icon: History },
        { path: '/donor-qr', label: 'Digital Passport', icon: QrCode },
        { path: '/donor/gamification', label: 'Rewards & Gamification', icon: Award },
        { path: '/life-impact-board', label: 'Life Impact Board', icon: HeartHandshake },
        { path: '/profile', label: 'Donor Profile', icon: User },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-[#5A1827] border-r-2 border-[#E5C158]/30 flex flex-col h-screen sticky top-0 z-40 font-sans shadow-xl shrink-0">
      {/* Brand Header Section */}
      <div className="p-6 border-b-2 border-[#E5C158]/20 flex items-center gap-3 bg-[#4A121F]">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E5C158] to-amber-300 flex items-center justify-center text-[#5A1827] font-black shadow-lg border border-white/20">
          LP
        </div>
        <div>
          <h1 className="text-base font-black text-white tracking-wider">LifePulse</h1>
          <p className="text-[10px] text-[#E5C158] font-black uppercase tracking-widest">
            {userRole === 'admin' ? 'Admin Portal' : 'Donor Portal'}
          </p>
        </div>
      </div>

      {/* Navigation Links Section */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E5C158] text-[#5A1827] shadow-lg shadow-amber-500/20 border-2 border-white/30 font-extrabold'
                    : 'text-rose-100 hover:bg-[#6B1D2F] hover:text-[#E5C158] border-2 border-transparent'
                }`
              }
            >
              <IconComponent className="w-4 h-4 transition-transform duration-200 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Add Blood Entry link */}
        <NavLink
          to="/add-blood-record"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${
              isActive 
                ? 'bg-[#E5C158] text-[#5A1827] shadow-lg shadow-amber-500/20 border-2 border-white/30 font-extrabold' 
                : 'text-rose-100 hover:bg-[#6B1D2F] hover:text-[#E5C158] border-2 border-transparent'
            }`
          }
        >
          <PlusCircle className="w-4 h-4 transition-transform duration-200" />
          <span>Add Blood Entry</span>
        </NavLink>
      </nav>

      {/* Logout Footer Section */}
      <div className="p-4 border-t-2 border-[#E5C158]/20 bg-[#4A121F]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 transition-colors text-left border border-rose-500/30 shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;