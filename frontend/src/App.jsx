import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Public Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Dashboard Layout Components
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import BloodStock from './pages/BloodStock';
import BloodList from './pages/BloodList';
import MyDonations from './pages/MyDonations';
import DonorPassport from './pages/DonorPassport';
import DonorProfile from './pages/DonorProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import StaffRegistration from './pages/StaffRegistration';
import HospitalOnboarding from './pages/HospitalOnboarding';
import GeoPulseRadar from './pages/GeoPulseRadar';
import PatientRequests from './pages/PatientRequests';
import PatientRequestForm from './pages/PatientRequestForm';
import Home from './pages/Home';
import FAQPage from './pages/FAQPage';
import AboutUsPage from './pages/AboutUsPage';
import DonorRecipientDispatchLog from './pages/DonorRecipientDispatchLog';
import LiveTracking from './pages/LiveTracking';
import GamificationRewards from './pages/GamificationRewards';
import LifeImpactBoard from './pages/LifeImpactBoard';
import StaffManagement from './pages/StaffManagement';
import AccountCenter from './pages/AccountCenter';
import HospitalSettings from './pages/HospitalSettings';
import ReportsAnalytics from './pages/ReportsAnalytics';
import './styles/Responsive.css';

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'hospital_admin' || value === 'admin') return 'hospital_admin';
  if (value === 'hospital_staff' || value === 'staff') return 'hospital_staff';
  return value || 'donor';
};

const ProtectedRoute = ({ allowedRole, requiredPermission, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const user = getUser();

  if (!token) return <Navigate to="/login" replace />;

  const userRole = normalizeRole(user?.role);
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole].filter(Boolean);
  const normalizedAllowedRoles = allowedRoles.map((value) => normalizeRole(value));

  if (normalizedAllowedRoles.length && !normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'hospital_admin' || userRole === 'hospital_staff' ? '/dashboard' : '/profile'} replace />;
  }

  if (adminOnly && userRole !== 'hospital_admin') return <Navigate to="/dashboard" replace />;
  if (requiredPermission && userRole !== 'hospital_admin' && !(user.permissions || []).includes(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const PublicLayout = () => (
  <div className="public-layout min-h-screen bg-slate-950 text-slate-100 flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const DashboardShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="dashboard-content flex-1 overflow-y-auto p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/staff-registration" element={<StaffRegistration />} />
          <Route path="/hospital-onboarding" element={<HospitalOnboarding />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about" element={<AboutUsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole={['hospital_admin', 'hospital_staff']} />}>
          <Route element={<DashboardShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account-center" element={<AccountCenter />} />

            <Route element={<ProtectedRoute allowedRole={['hospital_admin', 'hospital_staff']} requiredPermission="requests" />}>
              <Route path="/request-management" element={<PatientRequests />} />
              <Route path="/patient-request" element={<PatientRequestForm />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole={['hospital_admin', 'hospital_staff']} requiredPermission="dispatch" />}>
              <Route path="/geopulse-radar" element={<GeoPulseRadar />} />
              <Route path="/tracking" element={<LiveTracking />} />
              <Route path="/donor-recipient-dispatch-log" element={<DonorRecipientDispatchLog />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole={['hospital_admin', 'hospital_staff']} requiredPermission="inventory" />}>
              <Route path="/add-blood" element={<BloodStock />} />
              <Route path="/blood-list" element={<BloodList />} />
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/settings" element={<HospitalSettings />} />
              <Route path="/staff-management" element={<StaffManagement />} />
              <Route path="/reports" element={<ReportsAnalytics />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRole="donor" />}>
          <Route element={<DashboardShell />}>
            <Route path="/profile" element={<DonorProfile />} />
            <Route path="/history" element={<MyDonations />} />
            <Route path="/donor-qr" element={<DonorPassport />} />
            <Route path="/donor/gamification" element={<GamificationRewards />} />
            <Route path="/life-impact-board" element={<LifeImpactBoard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;