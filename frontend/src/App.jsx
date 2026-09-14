import React, { useState } from 'react';
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
import DispatchModal from './pages/DispatchModal';
import Login from './pages/Login';
import Register from './pages/Register';
import HospitalOnboarding from './pages/HospitalOnboarding';
import GeoPulseRadar from './pages/GeoPulseRadar';
import EmergencyTraumaHub from './pages/EmergencyTraumaHub';
import HospitalEmergencyForm from './pages/HospitalEmergencyForm';
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

// Simplified Protected Route Guard
const ProtectedRoute = ({ allowedRole, requiredPermission, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role || 'donor').toString().trim().toLowerCase();
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole].filter(Boolean);

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'admin' || userRole === 'staff' ? '/dashboard' : '/profile'} replace />;
  }

  if (adminOnly && userRole !== 'admin') return <Navigate to="/dashboard" replace />;
  if (requiredPermission && userRole !== 'admin' && !(user.permissions || []).includes(requiredPermission)) return <Navigate to="/dashboard" replace />;

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

const DashboardLayout = () => (
  <DashboardShell />
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
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/hospital-onboarding" element={<HospitalOnboarding />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about" element={<AboutUsPage />} />
        </Route>

        {/* SHARED PROTECTED ROUTES (Both Admin & Donor can access smoothly) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/profile" element={<DonorProfile />} />
          </Route>
        </Route>

        {/* STRICT ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRole={['admin', 'staff']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route element={<ProtectedRoute requiredPermission="inventory" />}>
              <Route path="/blood-list" element={<BloodList />} />
              <Route path="/add-blood" element={<BloodStock />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="dispatch" />}>
              <Route path="/dispatch" element={<DispatchModal isOpen={true} onClose={() => {}} />} />
              <Route path="/donor-recipient-dispatch-log" element={<DonorRecipientDispatchLog />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="emergency" />}><Route path="/hospital-request" element={<HospitalEmergencyForm />} /></Route>
            <Route element={<ProtectedRoute requiredPermission="emergency" />}><Route path="/trauma-network" element={<EmergencyTraumaHub />} /></Route>
            <Route element={<ProtectedRoute requiredPermission="dispatch" />}><Route path="/geopulse-radar" element={<GeoPulseRadar />} /></Route>
            <Route element={<ProtectedRoute requiredPermission="requests" />}><Route path="/patient-requests" element={<PatientRequests />} /><Route path="/patient-request" element={<PatientRequestForm />} /></Route>
            <Route element={<ProtectedRoute requiredPermission="tracking" />}><Route path="/tracking" element={<LiveTracking />} /></Route>
            <Route path="/account-center" element={<AccountCenter />} />
            <Route element={<ProtectedRoute adminOnly />}><Route path="/settings" element={<HospitalSettings />} /><Route path="/staff-management" element={<StaffManagement />} /><Route path="/reports" element={<ReportsAnalytics />} /></Route>
          </Route>
        </Route>

        {/* STRICT DONOR ROUTES */}
        <Route element={<ProtectedRoute allowedRole="donor" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/history" element={<MyDonations />} />
            <Route path="/donor-qr" element={<DonorPassport />} />
            <Route path="/donor/gamification" element={<GamificationRewards />} />
          <Route path="/life-impact-board" element={<LifeImpactBoard />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;