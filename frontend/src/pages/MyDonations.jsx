import React, { useState, useEffect } from 'react';
import { Droplet, Calendar, AlertCircle, History, RefreshCcw, User } from 'lucide-react';
import { API_URL } from '../api';

const MyDonations = ({ currentUserName }) => {
  const [donations, setDonations] = useState([]);
  const [impactLogs, setImpactLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDonorName, setActiveDonorName] = useState('');

  // Donor Profile wali exact logic: Detect active logged-in donor securely from storage or props
  useEffect(() => {
    const getActiveDonor = () => {
      // 1. Check props first
      if (currentUserName) return currentUserName;

      // 2. Check standard localStorage keys used across donor profiles & auth
      const storedUser = localStorage.getItem('donorName') || 
                         localStorage.getItem('userName') || 
                         localStorage.getItem('user') ||
                         sessionStorage.getItem('donorName');

      if (storedUser) {
        // Agar stored user object ki surat mein ho ya string
        try {
          const parsed = JSON.parse(storedUser);
          return parsed.name || parsed.donorName || storedUser;
        } catch {
          return storedUser;
        }
      }

      // 3. Fallback to top-right UI header text if rendered or default to empty
      return '';
    };

    const donorName = getActiveDonor();
    setActiveDonorName(donorName);
  }, [currentUserName]);

  useEffect(() => {
    if (activeDonorName) {
      fetchDonorDonations(activeDonorName);
    }
  }, [activeDonorName]);

  const fetchDonorDonations = async (targetName) => {
    try {
      setLoading(true);
      let storedUser = {};
      try {
        storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      } catch {
        storedUser = {};
      }
      const email = storedUser.email || localStorage.getItem('userEmail') || '';
      const impactQuery = email ? `email=${encodeURIComponent(email)}` : `donorName=${encodeURIComponent(targetName)}`;
      const [response, impactResponse] = await Promise.all([
        fetch(`${API_URL}/donations`),
        fetch(`${API_URL}/life-impact?${impactQuery}`)
      ]);
      if (response.ok) {
        const data = await response.json();
        const dataList = Array.isArray(data) ? data : data.donations || [];
        
        // Strict Filter: Sirf usi donor ki donations aayengi jo profile khol kar baitha hai
        const userRecords = dataList.filter((item) => {
          const recordDonor = (item.donorName || item.name || '').trim().toLowerCase();
          const currentLoggedIn = targetName.trim().toLowerCase();
          
          return recordDonor === currentLoggedIn || recordDonor.includes(currentLoggedIn) || currentLoggedIn.includes(recordDonor);
        });

        setDonations(userRecords);
      }
      if (impactResponse.ok) {
        const impactData = await impactResponse.json();
        setImpactLogs(impactData.impactLogs || []);
      }
    } catch (error) {
      console.error("Error fetching filtered donor donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatUnitId = (item, idx) => {
    if (item.unitId) return item.unitId;
    if (item.code) return item.code;
    const rawId = item._id ? item._id.toString() : '';
    const shortId = rawId.length > 4 ? rawId.slice(-4).toUpperCase() : rawId;
    return `BLD-${shortId || 100 + idx}`;
  };

  const totalPintsDonated = donations.reduce((acc, item) => {
    return acc + Number(item.units || item.pints || 1);
  }, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#5A1827] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border-2 border-[#6B1D2F]/30 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
          <div>
            <span className="px-3 py-1 bg-rose-100 border border-rose-300 text-[#990000] font-black text-xs rounded-xl uppercase tracking-wider shadow-sm">
              Donor Portal Dashboard
            </span>
            <h1 className="text-2xl font-black text-[#5A1827] flex items-center gap-2 mt-2">
              <History className="w-7 h-7 text-[#E5C158]" />
              My Donations ({activeDonorName || 'Donor'})
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#990000]" />
              Showing exclusive blood contributions for your signed-in profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => activeDonorName && fetchDonorDonations(activeDonorName)}
              className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-[#990000] hover:bg-rose-200 transition cursor-pointer shadow-sm"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>

            {/* Total Stats Card */}
            <div className="bg-gradient-to-r from-[#FAF9F6] to-rose-50 border-2 border-[#6B1D2F]/30 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <div className="p-2 bg-rose-100 rounded-xl border border-rose-300">
                <Droplet className="w-5 h-5 text-[#990000] fill-rose-500/20" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-black text-[#5A1827]">Your Total Donated</div>
                <div className="text-lg font-black text-[#990000]">{totalPintsDonated} Pints</div>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border-2 border-[#6B1D2F]/30 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F6] border-b-2 border-[#6B1D2F]/20 text-[#5A1827] font-black uppercase tracking-wider text-xs">
                  <th className="py-4 px-6">Unit ID</th>
                  <th className="py-4 px-6">Blood Type</th>
                  <th className="py-4 px-6">Units / Pints</th>
                  <th className="py-4 px-6">Donor Name</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">Hospital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6B1D2F]/10 font-medium text-[#5A1827]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-600 font-bold animate-pulse">
                      Loading your profile records...
                    </td>
                  </tr>
                ) : donations.length > 0 ? (
                  donations.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-rose-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-[#990000] font-black tracking-wide">
                        {formatUnitId(item, idx)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 font-black text-xs text-[#990000] bg-rose-100 border border-rose-300 rounded-xl shadow-sm">
                          {item.bloodGroup || item.group}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-black text-[#5A1827]">
                        {item.units || item.pints || 1} Pints
                      </td>
                      <td className="py-4 px-6 font-black text-[#5A1827]">
                        {item.donorName || item.name}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#5A1827]" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : (item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A')}
                      </td>
                      <td className="py-4 px-6">{impactLogs.find((log) => String(log.sourceDonationId) === String(item._id))?.patientName || 'Not allocated'}</td>
                      <td className="py-4 px-6">{impactLogs.find((log) => String(log.sourceDonationId) === String(item._id))?.hospitalName || 'Not allocated'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500 italic">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-[#990000]" />
                        <span className="font-bold">No donation records found for "{activeDonorName || 'Current User'}".</span>
                        <span className="text-[11px] text-slate-400">Abhi is profile ke naam se koi donation database me registered nahi hai.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyDonations;