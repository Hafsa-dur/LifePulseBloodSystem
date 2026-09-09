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
import AddBlood from './pages/AddBlood';
import GeoPulseRadar from './pages/GeoPulseRadar';
import EmergencyTraumaHub from './pages/EmergencyTraumaHub';
import HospitalEmergencyForm from './pages/HospitalEmergencyForm';
import PatientRequests from './pages/PatientRequests';
import Home from './pages/Home';
import FAQPage from './pages/FAQPage';
import AboutUsPage from './pages/AboutUsPage';
import DonorRecipientDispatchLog from './pages/DonorRecipientDispatchLog'; 
import LiveTracking from './pages/LiveTracking';
import GamificationRewards from './pages/GamificationRewards';
import LifeImpactBoard from './pages/LifeImpactBoard';
import './styles/Responsive.css';

// Simplified Protected Route Guard
const ProtectedRoute = ({ allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role || 'donor').toString().trim().toLowerCase();

  if (allowedRole && allowedRole !== userRole) {
    return <Navigate to={userRole === 'admin' ? '/dashboard' : '/profile'} replace />;
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
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about" element={<AboutUsPage />} />
        </Route>

        {/* SHARED PROTECTED ROUTES (Both Admin & Donor can access smoothly) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/profile" element={<DonorProfile />} />
            <Route path="/add-blood-record" element={<AddBlood />} />
          </Route>
        </Route>

        {/* STRICT ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-blood" element={<BloodStock />} />
            <Route path="/blood-list" element={<BloodList />} />
            <Route path="/dispatch" element={<DispatchModal isOpen={true} onClose={() => {}} />} />
            <Route path="/hospital-request" element={<HospitalEmergencyForm />} />
            <Route path="/trauma-network" element={<EmergencyTraumaHub />} />
            <Route path="/geopulse-radar" element={<GeoPulseRadar />} />
            <Route path="/patient-requests" element={<PatientRequests />} />
            <Route path="/donor-recipient-dispatch-log" element={<DonorRecipientDispatchLog />} />
            <Route path="/tracking" element={<LiveTracking />} />
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