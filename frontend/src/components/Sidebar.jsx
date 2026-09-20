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

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = String(user.role || 'donor').trim().toLowerCase();
  const normalizedRole = userRole === 'hospital_admin' || userRole === 'admin' ? 'hospital_admin' : userRole === 'hospital_staff' || userRole === 'staff' ? 'hospital_staff' : userRole;
  const isHospitalRole = normalizedRole === 'hospital_admin' || normalizedRole === 'hospital_staff';
  const can = (permission) => normalizedRole === 'hospital_admin' || (user.permissions || []).includes(permission);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getMenuItems = () => {
    if (isHospitalRole) {
      const adminItems = [
        { path: '/dashboard', label: 'System Overview', icon: LayoutDashboard },
        { path: '/account-center', label: 'Account Center', icon: User },
      ];

      const emergencyItems = [
        { path: '/dashboard', label: 'System Overview', icon: LayoutDashboard },
        { path: '/request-management', label: 'Request Management', icon: GitPullRequest },
        { path: '/patient-request', label: 'Submit Patient Request', icon: ClipboardList },
        { path: '/geopulse-radar', label: 'Location Intelligence', icon: Radio },
        { path: '/tracking', label: 'Live Transport Tracking', icon: Truck },
        { path: '/donor-recipient-dispatch-log', label: 'Dispatch Log', icon: ClipboardList },
        { path: '/account-center', label: 'Account Center', icon: User },
      ];

      if (normalizedRole === 'hospital_admin') {
        return [
          ...adminItems,
          ...(can('inventory') ? [{ path: '/add-blood', label: 'Blood Inventory', icon: PlusCircle }, { path: '/blood-list', label: 'Stock Directory', icon: Droplets }] : []),
          ...(can('requests') ? [{ path: '/request-management', label: 'Request Management', icon: GitPullRequest }, { path: '/patient-request', label: 'Submit Patient Request', icon: ClipboardList }] : []),
          ...(can('dispatch') ? [{ path: '/geopulse-radar', label: 'Location Intelligence', icon: Radio }, { path: '/donor-recipient-dispatch-log', label: 'Dispatch Log', icon: ClipboardList }] : []),
          ...(can('tracking') ? [{ path: '/tracking', label: 'Live Transport Tracking', icon: Truck }] : []),
          { path: '/reports', label: 'Reports & Analytics', icon: Activity },
          { path: '/staff-management', label: 'Staff Management', icon: User },
          { path: '/settings', label: 'Settings', icon: Hospital },
        ];
      }

      return [
        ...emergencyItems,
        { path: '/add-blood', label: 'Blood Inventory', icon: PlusCircle },
        { path: '/blood-list', label: 'Stock Directory', icon: Droplets },
      ];
    }

    return [
      { path: '/history', label: 'My Donations', icon: History },
      { path: '/donor-qr', label: 'Digital Passport', icon: QrCode },
      { path: '/donor/gamification', label: 'Rewards & Gamification', icon: Award },
      { path: '/life-impact-board', label: 'Life Impact Board', icon: HeartHandshake },
      { path: '/profile', label: 'Donor Profile', icon: User },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`sidebar-responsive ${isOpen ? 'sidebar-open' : ''} w-64 flex flex-col h-screen sticky top-0 z-40 font-sans shadow-xl shrink-0`}>
      <div className="sidebar-brand p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg border border-white/20">
          LP
        </div>
        <div>
          <h1 className="text-base font-black tracking-wider">LifePulse</h1>
          <p className="sidebar-kicker text-[10px] font-black uppercase tracking-widest">
            {normalizedRole === 'hospital_admin' ? 'Admin Portal' : normalizedRole === 'hospital_staff' ? 'Staff Portal' : 'Donor Portal'}
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
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'sidebar-link-active font-extrabold'
                    : 'sidebar-link border-2 border-transparent'
                }`
              }
            >
              <IconComponent className="w-4 h-4 transition-transform duration-200 shrink-0" />
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          );
        })}

      </nav>

      {/* Logout Footer Section */}
      <div className="sidebar-footer p-4">
        <button
          onClick={handleLogout}
          className="sidebar-logout w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors text-left shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="sidebar-link-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;