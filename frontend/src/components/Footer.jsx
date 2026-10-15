import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const Footer = () => {
  return (
    <footer className="bg-[#5A1827] text-rose-100 border-t-2 border-[#E5C158]/30 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <BrandLogo compact inverse />
            </Link>
            <p className="text-xs text-rose-200/80 leading-relaxed font-medium">
              Empowering healthcare networks with real-time blood inventory tracking, digital donor management, and instant response systems.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-black text-[#E5C158] uppercase tracking-wider mb-4">
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-xs font-bold">
              <li>
                <Link to="/" className="hover:text-[#E5C158] transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#E5C158] transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link to="/blood-list" className="hover:text-[#E5C158] transition-colors">Blood Inventory</Link>
              </li>
              <li>
                <Link to="/add-blood" className="hover:text-[#E5C158] transition-colors">Add Donation</Link>
              </li>
              <li>
                <Link to="/donor-qr" className="hover:text-[#E5C158] transition-colors">Donor QR Code</Link>
              </li>
            </ul>
          </div>

          {/* User Account */}
          <div>
            <h3 className="text-xs font-black text-[#E5C158] uppercase tracking-wider mb-4">
              Account & Portal
            </h3>
            <ul className="space-y-2.5 text-xs font-bold">
              <li>
                <Link to="/login" className="hover:text-[#E5C158] transition-colors">Donor Sign In</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#E5C158] transition-colors">Register as Donor</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#E5C158] transition-colors">User Profile</Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-[#E5C158] transition-colors">Donation History</Link>
              </li>
            </ul>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#E5C158] uppercase tracking-wider">
              Emergency Hotline
            </h3>
            <div className="p-4 rounded-2xl bg-[#4A121F] border-2 border-[#E5C158]/30 shadow-inner">
              <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider mb-1">24/7 Urgent Requests</p>
              <p className="text-base font-black text-[#E5C158]">+1 (800) 555-BLOOD</p>
              <p className="text-[10px] text-rose-200 mt-2 font-semibold">support@vitaltrack.org</p>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t-2 border-[#E5C158]/20 flex flex-col sm:flex-row justify-between items-center text-xs text-rose-200 font-medium gap-4">
          <p>© {new Date().getFullYear()} VitalTrack Intelligent Donor Matching &amp; Tracking System. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#E5C158] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#E5C158] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#E5C158] transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;