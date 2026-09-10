import React, { useState, useEffect } from 'react';
import { Search, Send, AlertTriangle, CheckCircle, PackageCheck, Droplets, User, Building2, Calendar, FileText, Radio, X, Hash, Clock } from 'lucide-react';
import { API_URL } from '../api';

const BloodStock = () => {
  const [activeTab, setActiveTab] = useState('donors'); // 'donors' | 'patients' | 'dispatches'
  
  const [donations, setDonations] = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dispatch Modal States (Unified & Corrected)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [hospital, setHospital] = useState('');
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [units, setUnits] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Date & Time Handling
  const getCurrentDateTime = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    return { dateStr, timeStr };
  };

  const initialDT = getCurrentDateTime();
  const [dispatchDate, setDispatchDate] = useState(initialDT.dateStr);
  const [dispatchTime, setDispatchTime] = useState(initialDT.timeStr);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const donationsRes = await fetch('${API_URL}/api/donations');
      const requestsRes = await fetch('${API_URL}/api/patient-requests');

      if (donationsRes.ok) {
        const donationsData = await donationsRes.json();
        setDonations(donationsData);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setPatientRequests(requestsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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

  // Separate normal donations from dispatches
  const normalDonations = donations.filter(item => {
    const status = (item.status || '').toLowerCase();
    const donorName = (item.donorName || item.name || '').toLowerCase();
    const unitsVal = Number(item.units || item.pints || 0);
    return status !== 'dispatched' && unitsVal > 0 && !donorName.includes('dispatched');
  });

  const dispatchRecords = donations.filter(item => {
    const status = (item.status || '').toLowerCase();
    const donorName = (item.donorName || item.name || '').toLowerCase();
    const unitsVal = Number(item.units || item.pints || 0);
    return status === 'dispatched' || unitsVal < 0 || donorName.includes('dispatched');
  });

  // Handle Dispatch Submit
  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!hospital.trim() || !patientName.trim()) {
      alert("Please fill in both hospital and patient names.");
      return;
    }

    try {
      setSubmitting(true);
      const dispatchData = {
        donorName: `Dispatched to: ${hospital}`,
        hospitalName: hospital,
        patientName: patientName,
        bloodGroup,
        units: Math.abs(Number(units)),
        status: 'dispatched',
        dispatchDate,
        dispatchTime
      };

      const response = await fetch('${API_URL}/api/donations/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchData)
      });

      if (response.ok) {
        setIsDispatchOpen(false);
        setHospital('');
        setPatientName('');
        setUnits(1);
        setBloodGroup('A+');
        await fetchAllData();
      } else {
        alert("Failed to submit dispatch record.");
      }
    } catch (error) {
      console.error("Dispatch error:", error);
      alert("Server error while dispatching.");
    } finally {
      setSubmitting(false);
    }
  };

  // Stock summary calculation for all 8 blood groups (Synced with Dispatches / Patient Outflow)
  const allBloodGroupsList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const groupCounts = allBloodGroupsList.reduce((acc, grp) => {
    acc[grp] = 0;
    return acc;
  }, {});

  // Add collected units
  normalDonations.forEach((item) => {
    const grp = item.bloodGroup || item.group || item.bloodType;
    const pints = Number(item.units || item.pints || 0);
    if (grp && groupCounts.hasOwnProperty(grp)) {
      groupCounts[grp] += pints;
    }
  });

  Object.keys(groupCounts).forEach((grp) => {
    if (groupCounts[grp] < 0) {
      groupCounts[grp] = 0;
    }
  });

  const totalDispatchedPints = dispatchRecords.reduce((acc, item) => {
    return acc + Math.abs(Number(item.units || item.pints || 0));
  }, 0);

  const criticalGroups = Object.entries(groupCounts)
    .filter(([_, count]) => count < 2)
    .map(([grp]) => grp);

  return (
    <div className="w-full px-6 py-4 space-y-6 text-[#5A1827] min-h-screen bg-[#FAF9F6] relative font-sans">
      
      {/* Header */}
      <div className="bg-white border-2 border-[#6B1D2F] p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
        <div>
          <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
            Inventory & Management
          </span>
          <h1 className="text-3xl font-black text-[#5A1827] flex items-center gap-2 mt-2">
            Blood Stock & Records Directory
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            Clean, separated views for donor contributions, patient requests, and hospital dispatches.
          </p>
        </div>

        <button 
          onClick={() => setIsDispatchOpen(true)}
          className="bg-[#E5C158] hover:bg-[#D4AF37] text-slate-950 font-black px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
        >
          <Send className="w-4 h-4" /> Request Dispatch
        </button>
      </div>
      {/* Navigation Tabs to Switch Views */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border-2 border-[#6B1D2F] shadow-sm">
        <button
          onClick={() => setActiveTab('donors')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition cursor-pointer ${
            activeTab === 'donors'
              ? 'bg-[#5A1827] text-white shadow-md'
              : 'bg-[#FAF9F6] text-[#5A1827] hover:bg-slate-100 border border-[#6B1D2F]/20'
          }`}
        >
          <User className="w-4 h-4" /> Donor Contributions ({normalDonations.length})
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition cursor-pointer ${
            activeTab === 'patients'
              ? 'bg-[#5A1827] text-white shadow-md'
              : 'bg-[#FAF9F6] text-[#5A1827] hover:bg-slate-100 border border-[#6B1D2F]/20'
          }`}
        >
          <FileText className="w-4 h-4" /> Patient Requests ({patientRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('dispatches')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition cursor-pointer ${
            activeTab === 'dispatches'
              ? 'bg-[#5A1827] text-white shadow-md'
              : 'bg-[#FAF9F6] text-[#5A1827] hover:bg-slate-100 border border-[#6B1D2F]/20'
          }`}
        >
          <Building2 className="w-4 h-4" /> Hospital Dispatches ({dispatchRecords.length})
        </button>
      </div>

      {/* TAB 1: DONOR CONTRIBUTIONS */}
      {activeTab === 'donors' && (
        <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-[#FAF9F6] border-b-2 border-[#6B1D2F]/20 flex justify-between items-center">
            <h2 className="font-black text-lg text-[#5A1827] flex items-center gap-2">
              <User className="w-5 h-5 text-[#6B1D2F]" /> Registered Donor Contributions
            </h2>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg">
              Active Stock Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#5A1827] font-black uppercase tracking-wider text-xs">
                  <th className="py-4 px-4">Unit ID</th>
                  <th className="py-4 px-4">Donor Name</th>
                  <th className="py-4 px-4">Blood Type</th>
                  <th className="py-4 px-4">Donated Units</th>
                  <th className="py-4 px-4">Registration Date</th>
                  <th className="py-4 px-4">Last Donation Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading donor records...</td></tr>
                ) : normalDonations.length > 0 ? (
                  normalDonations.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-[#FAF4EC] transition-colors">
                      <td className="py-4 px-4 font-mono text-[#5A1827] font-black">{formatUnitId(item, idx)}</td>
                      <td className="py-4 px-4 text-[#5A1827] font-bold">{item.donorName || item.name || 'Anonymous'}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 font-black text-xs text-rose-700 bg-rose-100 border border-rose-300 rounded-lg">
                          {item.bloodGroup || item.group || item.bloodType}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-900">{Math.abs(Number(item.units || item.pints || 1))} Pints</td>
                      <td className="py-4 px-4 text-slate-600 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="py-4 px-4 text-rose-600 text-xs font-bold">{item.lastDonationDate ? new Date(item.lastDonationDate).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center py-10 text-slate-500 italic">No donor contributions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT REQUESTS */}
      {activeTab === 'patients' && (
        <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-[#FAF9F6] border-b-2 border-[#6B1D2F]/20 flex justify-between items-center">
            <h2 className="font-black text-lg text-[#5A1827] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#6B1D2F]" /> Patient Blood Requests
            </h2>
            <span className="text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1 rounded-lg">
              Requisitions Queue
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#5A1827] font-black uppercase tracking-wider text-xs">
                  <th className="py-4 px-4">Patient Name</th>
                  <th className="py-4 px-4">Blood Group</th>
                  <th className="py-4 px-4">Units Required</th>
                  <th className="py-4 px-4">Hospital Name</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Request Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading patient requests...</td></tr>
                ) : patientRequests.length > 0 ? (
                  patientRequests.map((req, idx) => (
                    <tr key={req._id || idx} className="hover:bg-[#FAF4EC] transition-colors">
                      <td className="py-4 px-4 font-bold text-[#5A1827]">{req.patientName || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 font-black text-xs text-rose-700 bg-rose-100 border border-rose-300 rounded-lg">
                          {req.bloodGroup}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-900">{req.unitsRequired || req.units || 1} Pints</td>
                      <td className="py-4 px-4 text-blue-700 font-medium">{req.hospitalName || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          req.status === 'Dispatched' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {req.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-xs">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center py-10 text-slate-500 italic">No patient requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TAB 3: HOSPITAL DISPATCHES */}
      {activeTab === 'dispatches' && (
        <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-[#FAF9F6] border-b-2 border-[#6B1D2F]/20 flex justify-between items-center">
            <h2 className="font-black text-lg text-[#5A1827] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#6B1D2F]" /> Hospital Dispatch History
            </h2>
            <span className="text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-lg">
              Dispatched Units Log
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#5A1827] font-black uppercase tracking-wider text-xs">
                  <th className="py-4 px-4">Dispatch ID</th>
                  <th className="py-4 px-4">Hospital / Entity Name</th>
                  <th className="py-4 px-4">Blood Type</th>
                  <th className="py-4 px-4">Dispatched Units</th>
                  <th className="py-4 px-4">Dispatch Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading dispatch records...</td></tr>
                ) : dispatchRecords.length > 0 ? (
                  dispatchRecords.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-[#FAF4EC] transition-colors">
                      <td className="py-4 px-4 font-mono text-[#5A1827] font-black">{formatUnitId(item, idx)}</td>
                      <td className="py-4 px-4 text-blue-700 font-bold">{item.hospitalName || (item.donorName || '').replace('Dispatched to: ', '') || 'Hospital'}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 font-black text-xs text-rose-700 bg-rose-100 border border-rose-300 rounded-lg">
                          {item.bloodGroup || item.group || item.bloodType || 'A+'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-red-600">{Math.abs(Number(item.units || item.pints || 1))} Pints</td>
                      <td className="py-4 px-4 text-slate-600 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-10 text-slate-500 italic">No dispatch records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Cards at Bottom */}
      <div className="blood-stock-summary-grid grid grid-cols-1 md:grid-cols-3 items-start gap-5 pt-2">
        
        {/* Card 1: Available Stock Summary */}
        <div className="blood-stock-summary-card blood-stock-summary-card--list bg-white border-2 border-[#6B1D2F] p-5 rounded-2xl shadow-md flex flex-col items-center justify-between text-center">
          <div className="flex items-center gap-2 mb-2 w-full justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
            <h3 className="text-[#5A1827] font-black text-xs uppercase tracking-wider">
              Available Stock Summary
            </h3>
          </div>
          <div className="flex flex-col gap-1.5 w-full max-w-[250px] mx-auto overflow-y-auto max-h-[180px] pr-1">
            {Object.entries(groupCounts).map(([grp, count]) => (
              <div key={grp} className="flex justify-between items-center border font-black px-3 py-1 rounded-xl text-xs shadow-inner bg-emerald-50 border-emerald-300 text-emerald-900">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" />
                  {grp}:
                </span>
                <span className="font-extrabold">{count} Pints</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Recent Dispatches Count */}
        <div className="blood-stock-summary-card bg-white border-2 border-[#6B1D2F] p-5 rounded-2xl shadow-md flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3 w-full justify-center">
            <PackageCheck className="w-5 h-5 text-blue-700 shrink-0" />
            <h3 className="text-[#5A1827] font-black text-xs uppercase tracking-wider">
              Total Dispatched Units
            </h3>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full max-w-[240px] mx-auto shadow-inner flex flex-col items-center justify-center">
            <span className="font-black text-blue-700 bg-white border border-blue-300 px-4 py-2 rounded-lg text-2xl shadow-sm inline-block">
              {totalDispatchedPints} Pints
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2 italic">
            Across all hospital dispatches
          </p>
        </div>

        {/* Card 3: Critical Shortage Alert */}
        <div className="blood-stock-summary-card bg-white border-2 border-[#6B1D2F] p-5 rounded-2xl shadow-md flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3 w-full justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-[#5A1827] font-black text-xs uppercase tracking-wider">
              Critical Shortage Alert
            </h3>
          </div>
          <div className={`border-2 rounded-xl p-4 w-full max-w-[240px] mx-auto flex flex-col items-center justify-center ${criticalGroups.length > 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
            {criticalGroups.length > 0 ? (
              <>
                <p className="text-xs text-rose-900 font-semibold mb-2">⚠️ Immediate Attention Required</p>
                <span className="font-black text-rose-700 text-xl underline decoration-rose-600 block">
                  {criticalGroups.join(', ')}
                </span>
                <p className="text-[11px] text-rose-800 font-medium mt-2">(Less than 2 Pints)</p>
              </>
            ) : (
              <p className="text-xs text-emerald-950 font-bold py-2 flex items-center justify-center gap-1.5 text-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                All blood groups are above critical levels.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* DISPATCH MODAL POPUP */}
      <div>
        {isDispatchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#FAF9F6] border-2 border-[#5A1827] rounded-2xl p-6 w-full max-w-md text-[#5A1827] shadow-2xl relative font-sans">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-5 border-b-2 border-[#5A1827]/15 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#990000] animate-pulse" />
                  <h2 className="text-xl font-black text-[#5A1827]">Dispatch Blood Units & Log</h2>
                </div>
                <button 
                  onClick={() => setIsDispatchOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#5A1827]/30 text-[#5A1827] hover:bg-rose-100 hover:text-rose-900 transition font-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleConfirmDispatch} className="space-y-3.5">
                
                {/* Hospital Name */}
                <div>
                  <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#5A1827]" /> Hospital / Medical Center Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rehman Medical Institute"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full bg-white border-2 border-[#5A1827]/30 rounded-xl px-4 py-2 text-[#5A1827] font-semibold text-sm focus:outline-none focus:border-[#5A1827] transition shadow-inner"
                  />
                </div>

                {/* Patient Name */}
                <div>
                  <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#990000]" /> Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-white border-2 border-[#5A1827]/30 rounded-xl px-4 py-2 text-[#5A1827] font-semibold text-sm focus:outline-none focus:border-[#5A1827] transition shadow-inner"
                  />
                </div>

                {/* Blood Group and Units Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-[#990000]" /> Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-white border-2 border-[#5A1827]/30 rounded-xl px-3 py-2 text-[#5A1827] font-bold text-sm focus:outline-none focus:border-[#5A1827] transition shadow-inner cursor-pointer"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((grp) => (
                        <option key={grp} value={grp}>{grp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#5A1827]" /> Units (Pints)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      className="w-full bg-white border-2 border-[#5A1827]/30 rounded-xl px-4 py-2 text-[#5A1827] font-bold text-sm focus:outline-none focus:border-[#5A1827] transition shadow-inner"
                    />
                  </div>
                </div>

                {/* Exact Date & Time Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5A1827]" /> Dispatch Date
                    </label>
                    <input
                      type="date"
                      required
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="w-full bg-white border-2 border-[#5A1827]/30 rounded-xl px-3 py-2 text-[#5A1827] font-bold text-xs focus:outline-none focus:border-[#5A1827] transition shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5A1827]" /> Dispatch Time
                    </label>
                    <input
                      type="time"
                      required
                      value={dispatchTime}
                      onChange={(e) => setDispatchTime(e.target.value)}
                      className="w-full bg-white border-2 border-[#5A1827]/30 rounded-xl px-3 py-2 text-[#5A1827] font-bold text-xs focus:outline-none focus:border-[#5A1827] transition shadow-inner"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#5A1827]/10 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsDispatchOpen(false)}
                    className="px-4 py-2 rounded-xl text-[#5A1827] font-bold text-xs uppercase tracking-wider border-2 border-[#5A1827]/30 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-white font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#5A1827] to-[#802035] hover:from-[#3D101A] hover:to-[#5A1827] border border-[#E5C158]/50 shadow-md active:scale-95 disabled:opacity-50 transition cursor-pointer"
                  >
                    {submitting ? 'Processing...' : 'Confirm Dispatch'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default BloodStock;