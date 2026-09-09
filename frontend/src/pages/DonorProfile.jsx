import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, ShieldCheck, Droplet, Calendar, Clock } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [lastDonationDate, setLastDonationDate] = useState('N/A');
  const [nextEligibleDate, setNextEligibleDate] = useState('N/A');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'Not Specified');

  useEffect(() => {
    const fetchUserDonations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/donations');
        // Filter user's specific donations
        const myDonations = response.data.filter(
          (item) => item.donorName?.toLowerCase() === user?.name?.toLowerCase() || item.email === user?.email
        );

        if (myDonations.length > 0) {
          // Latest donation
          const latest = myDonations[myDonations.length - 1];
          
          if (latest.bloodGroup) {
            setBloodGroup(latest.bloodGroup);
          }

          const donationDateStr = latest.donationDate || latest.createdAt;
          if (donationDateStr) {
            const dDate = new Date(donationDateStr);
            setLastDonationDate(dDate.toISOString().split('T')[0]);

            // 56 days gap calculation
            const nextDate = new Date(dDate);
            nextDate.setDate(nextDate.getDate() + 56);
            setNextEligibleDate(nextDate.toISOString().split('T')[0]);
          }
        }
      } catch (err) {
        console.error('Error loading profile donation data:', err);
      }
    };

    fetchUserDonations();
  }, [user]);

  return (
    <div className="w-full px-4 py-2 space-y-4 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      
      {/* Main Container - Full Width Spread */}
      <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl p-6 shadow-md space-y-6 w-full">
        
        {/* Header */}
        <div className="border-b-2 border-[#6B1D2F]/10 pb-3">
          <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
            User Credentials
          </span>
          <h1 className="text-3xl font-black text-[#5A1827] mt-2">Donor Profile</h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Manage your personal donor credentials and eligibility tracking.
          </p>
        </div>

        {/* Profile Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-[#FAF9F6] p-4 rounded-xl border-2 border-[#6B1D2F]/30 shadow-inner">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#6B1D2F]" /> Full Name
            </label>
            <p className="text-[#5A1827] font-bold text-base">{user?.name || 'Hafsa Sohail'}</p>
          </div>

          <div className="bg-[#FAF9F6] p-4 rounded-xl border-2 border-[#6B1D2F]/30 shadow-inner">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#6B1D2F]" /> Email Address
            </label>
            <p className="text-[#5A1827] font-bold text-base">{user?.email || 'hafsa@gmail.com'}</p>
          </div>

          <div className="bg-[#FAF9F6] p-4 rounded-xl border-2 border-[#6B1D2F]/30 shadow-inner">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#6B1D2F]" /> System Role
            </label>
            <p className="text-[#5A1827] font-black text-base">{user?.role || 'Administrator'}</p>
          </div>

          <div className="bg-[#FAF9F6] p-4 rounded-xl border-2 border-[#6B1D2F]/30 shadow-inner">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-rose-600" /> Blood Group
              </label>
              <span className="text-[10px] text-slate-500 font-semibold">(Dynamic Sync)</span>
            </div>
            <p className={`font-black text-lg ${bloodGroup !== 'Not Specified' ? 'text-rose-700' : 'text-slate-500'}`}>
              {bloodGroup}
            </p>
          </div>

        </div>

        {/* Schedule Tracker */}
        <div className="bg-[#FAF9F6] p-5 rounded-2xl border-2 border-[#6B1D2F]/40 space-y-4 shadow-sm">
          <h2 className="text-xs font-black tracking-widest text-[#5A1827] uppercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E5C158]" /> Donation Schedule Tracker
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Last Donation Date Box */}
            <div className="bg-white p-4 rounded-xl border-2 border-[#6B1D2F]/30 shadow-sm flex flex-col justify-between space-y-2">
              <p className="text-xs font-black text-[#5A1827] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-700" /> Last Donation Date
              </p>
              <div className="text-amber-950 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] border-2 border-[#D97706] px-4 py-2 rounded-xl font-mono font-black text-base shadow-md text-center tracking-wide">
                {lastDonationDate}
              </div>
            </div>

            {/* Next Eligible Date Box */}
            <div className="bg-white p-4 rounded-xl border-2 border-[#6B1D2F]/30 shadow-sm flex flex-col justify-between space-y-2">
              <p className="text-xs font-black text-[#5A1827] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" /> Next Eligible Date (56 Days Gap)
              </p>
              <div className="text-amber-950 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] border-2 border-[#D97706] px-4 py-2 rounded-xl font-mono font-black text-base shadow-md text-center tracking-wide">
                {nextEligibleDate}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;