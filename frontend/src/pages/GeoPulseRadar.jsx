import { useState, useEffect } from 'react';
import { MapPin, Mail, Radio, CheckCircle, AlertCircle, Navigation, Send, X, Droplet } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const GeoPulseRadar = () => {
  const [donors, setDonors] = useState([]);
  const [requestMatches, setRequestMatches] = useState([]);

  // Modal state for sending a request-backed donor alert.
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ type: '', text: '' });
  const [customMessage, setCustomMessage] = useState('');

  const getDonorProximityInfo = (donor, matches = []) => {
    const donorKey = String(donor.donorName || donor.name || '').trim().toLowerCase();
    const donorMatch = matches.find((request) => {
      if (request.donorId && donor._id) return String(request.donorId) === String(donor._id);
      const requestDonor = String(request.donorName || '').trim().toLowerCase();
      return requestDonor && donorKey && requestDonor === donorKey;
    });

    const explicitDistance = Number(donor.distance ?? donor.distanceInKilometers ?? donor.proximityKm ?? donor.estimatedDistance ?? NaN);
    const nearestDistance = Number.isFinite(explicitDistance) ? explicitDistance : Number(donorMatch?.donorDistance ?? NaN);

    if (Number.isFinite(nearestDistance)) {
      return {
        proximityKm: nearestDistance,
        label: `Nearest match: ${nearestDistance.toFixed(1)} km from hospital`,
        isNearest: true
      };
    }

    return {
      proximityKm: null,
      label: 'Saved donor location used for matching',
      isNearest: false
    };
  };

  const fetchRealDonors = async (matches = []) => {
    try {
      const response = await fetch(`${API_URL}/donations`, { headers: authHeaders() });
      if (response.ok) {
        const data = await parseResponse(response);

        const activeDonors = data.filter(item => {
          const donorNameStr = item.donorName || item.name || '';
          const lowerName = donorNameStr.toLowerCase();
          const status = String(item.status || '').toLowerCase();
          const donorLocation = String(item.location || item.address || '').trim();
          return !lowerName.includes('dispatched to') && status !== 'dispatched' &&
            item.role !== 'patient' && Number(item.units || 0) > 0 && (item.availableUnits === undefined || Number(item.availableUnits) > 0) && Boolean(donorLocation);
        });

        const enrichedDonors = activeDonors.map((donor) => ({
          ...donor,
          physicalAddress: donor.location || donor.address || '',
          ...getDonorProximityInfo(donor, matches)
        }));

        enrichedDonors.sort((first, second) => {
          if (first.proximityKm == null && second.proximityKm == null) return 0;
          if (first.proximityKm == null) return 1;
          if (second.proximityKm == null) return -1;
          return first.proximityKm - second.proximityKm;
        });

        setDonors(enrichedDonors);
      }
    } catch (error) {
      console.error("Error fetching live donors:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`${API_URL}/patient-requests`, { headers: authHeaders() });
        const data = await parseResponse(response);
        const matchedRequests = Array.isArray(data) ? data.filter((request) => request.locationMatchStatus) : [];
        setRequestMatches(matchedRequests);
        await fetchRealDonors(matchedRequests);
      } catch (error) {
        console.error('Error fetching request matches:', error);
      }
    };

    loadData();
  }, []);

  // Open Email Dispatch Modal
  const openEmailModal = (donor) => {
    const donorRequest = requestMatches.find((request) => String(request.donorId || '') === String(donor._id || ''));
    setSelectedDonor(donor);
    setSelectedRequest(donorRequest || null);
    setCustomMessage(donorRequest
      ? `Urgent requirement for ${donorRequest.bloodGroup} blood for patient ${donorRequest.patientName} at ${donorRequest.hospitalName}. Please respond immediately.`
      : '');
    setEmailStatus({ type: '', text: '' });
    setIsEmailModalOpen(true);
  };

  // Send the selected donor alert through the backend mail service.
  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailStatus({ type: '', text: '' });

    try {
      if (!selectedDonor?._id || !selectedRequest?._id) {
        throw new Error('Select a donor linked to an active patient request before sending an email.');
      }

      const response = await fetch(`${API_URL}/hospital/send-donor-email`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          donorId: selectedDonor._id,
          patientRequestId: selectedRequest._id,
          customMessage,
          urgency: 'Urgent'
        })
      });

      const data = await parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch email.');
      }

      setEmailLoading(false);
      setEmailStatus({ type: 'success', text: 'Email successfully sent to the selected donor via LifePulse.' });
      
      setTimeout(() => {
        setIsEmailModalOpen(false);
      }, 1500);

    } catch (error) {
      setEmailLoading(false);
      setEmailStatus({ type: 'error', text: error.message || 'Something went wrong sending email. Please try again.' });
    }
  };

  return (
    <div className="w-full px-4 py-4 space-y-6 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      
      {/* Header Section */}
      <div className="bg-white border-2 border-[#6B1D2F] p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-md w-full">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
              Real Physical Address Matching
            </span>
            <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 text-xs px-3 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <Navigation className="w-3.5 h-3.5 text-emerald-700" /> Nearest First Matrix Active
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#5A1827] flex items-center gap-2.5 mt-2">
            <Radio className="text-rose-600 animate-pulse w-7 h-7" /> GeoPulse Donor Radar Matrix
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Real physical address proximity sorting for verified registered donors only.
          </p>
        </div>

        <button
          onClick={() => fetchRealDonors(requestMatches)}
          className="bg-[#E5C158] hover:bg-[#D4AF37] text-slate-950 font-black px-6 py-3 rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-slate-950" />
          Refresh Radar Matrix
        </button>
      </div>

      <div className="flex justify-end bg-white p-5 rounded-2xl border-2 border-[#6B1D2F] shadow-sm w-full">
        <div className="text-sm text-[#5A1827] font-bold flex items-center justify-between bg-[#FAF9F6] px-4 py-2 rounded-xl border-2 border-[#6B1D2F]/30 shadow-sm">
          <span>Donors With Saved Locations:</span>
          <span className="text-amber-950 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] border-2 border-[#D97706] px-3.5 py-1 rounded-xl font-black text-base shadow-md tracking-wide">
            {donors.length}
          </span>
        </div>
      </div>

      <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl overflow-hidden shadow-md w-full">
        <div className="p-5 border-b-2 border-[#6B1D2F]/15">
          <h2 className="text-xl font-black text-[#5A1827]">Nearest Donor Matches</h2>
          <p className="text-xs text-slate-600 font-medium mt-1">Matches are calculated from the saved donor and hospital locations when a request is submitted.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF9F6] text-[#5A1827] text-xs uppercase font-black"><tr><th className="p-4">Patient</th><th className="p-4">Group</th><th className="p-4">Hospital / Location</th><th className="p-4">Matched Donor / Location</th><th className="p-4">Distance</th><th className="p-4">Availability</th></tr></thead>
            <tbody className="divide-y divide-[#6B1D2F]/10">
              {requestMatches.length > 0 ? requestMatches.map((request) => <tr key={request._id}>
                <td className="p-4 font-black text-[#5A1827]">{request.patientName}</td>
                <td className="p-4 font-black text-rose-700">{request.bloodGroup}</td>
                <td className="p-4"><div className="font-bold">{request.hospitalName}</div><div className="text-xs text-slate-500">{request.hospitalLocation}</div></td>
                <td className="p-4"><div className="font-black">{request.donorName || 'No suitable donor found'}</div><div className="text-xs text-slate-500">{request.donorLocation || 'Inventory fallback'}</div></td>
                <td className="p-4 font-bold">{request.donorDistance !== null && request.donorDistance !== undefined ? `${request.donorDistance} km` : 'N/A'}</td>
                <td className="p-4"><span title={request.matchingDiagnostics?.map((item) => item.rejectionReason || 'eligible').join(', ')} className={`px-2 py-1 rounded-lg text-xs font-black ${request.locationMatchStatus === 'Matched' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{request.locationMatchStatus === 'Matched' ? 'Nearest Donor Selected' : request.matchingDiagnostics?.length ? `No suitable donor found (${request.matchingDiagnostics.map((item) => item.rejectionReason).filter(Boolean).join(', ')})` : 'No suitable donor found'}</span></td>
              </tr>) : <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No patient request matches available yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donor Table Section with Real Physical Addresses & Nearest Sorting */}
      <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl overflow-hidden shadow-md w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FAF9F6] border-b-2 border-[#6B1D2F]/20 text-[#5A1827] font-black uppercase tracking-wider text-xs">
                <th className="py-4 px-6">Group</th>
                <th className="py-4 px-6">Donor Details</th>
                <th className="py-4 px-6">Exact Real Physical Address</th>
                <th className="py-4 px-6">Proximity Status</th>
                <th className="py-4 px-6">Availability</th>
                <th className="py-4 px-6 text-right">Dispatch Action (Email)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B1D2F]/10 font-semibold text-slate-800">
              {donors.length > 0 ? (
                donors.map((donor, idx) => {
                  const donorGroup = donor.bloodGroup || donor.group || 'Unknown';
                  const donorPhone = donor.phone || donor.contact || 'Not provided';

                  return (
                    <tr key={donor._id || idx} className="hover:bg-[#FAF9F6] transition-colors group">
                      <td className="py-4 px-6">
                        <span className="inline-block px-3.5 py-1 font-black text-sm text-rose-700 bg-rose-100 border border-rose-300 rounded-lg shadow-sm">
                          {donorGroup}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-black text-[#5A1827] text-base group-hover:text-rose-700 transition">
                          {donor.donorName || donor.name || 'Registered Donor'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {donorPhone}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-semibold max-w-xs">
                        <span className="flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                          <span>{donor.physicalAddress}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-black px-3 py-1 rounded-lg text-xs shadow-inner inline-block border ${donor.isNearest ? 'text-emerald-900 bg-emerald-100 border-emerald-300' : 'text-amber-900 bg-[#E5C158]/20 border-[#E5C158]'}`}>
                          {donor.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-4 h-4 text-emerald-700" /> Ready
                        </span>
                      </td>
                      {/* Send Email Action Button */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openEmailModal(donor)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5A1827] hover:bg-[#3D101A] text-white font-black rounded-xl shadow-md transition active:scale-95 text-xs uppercase tracking-wider cursor-pointer border border-[#E5C158]/40"
                        >
                          <Mail className="w-4 h-4 text-[#E5C158]" />
                          Send Email
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 italic font-medium">
                    <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2 opacity-80" />
                    No active donors with saved locations found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backend Nodemailer Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#FAF9F6] border-2 border-[#5A1827] rounded-2xl p-6 w-full max-w-md text-[#5A1827] shadow-2xl relative font-sans">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-[#5A1827]/15 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#990000] animate-pulse" />
                <h2 className="text-lg font-black text-[#5A1827]">Send Email Alert via LifePulse</h2>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#5A1827]/30 text-[#5A1827] hover:bg-rose-100 hover:text-rose-900 transition font-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Message */}
            {emailStatus.text && (
              <div className={`p-3 mb-3 border-2 font-black rounded-xl text-xs text-center shadow-sm ${emailStatus.type === 'success' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>
                {emailStatus.text}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSendEmailSubmit} className="space-y-3 text-xs">
              {selectedRequest ? <div className="space-y-2 rounded-xl border-2 border-[#5A1827]/20 bg-white p-3 text-xs font-bold">
                <p><span className="text-slate-500">Hospital:</span> {selectedRequest.hospitalName}</p>
                <p><span className="text-slate-500">Patient:</span> {selectedRequest.patientName}</p>
                <p><span className="text-slate-500">Blood group:</span> {selectedRequest.bloodGroup}</p>
                <p><span className="text-slate-500">Hospital location:</span> {selectedRequest.hospitalLocation}</p>
              </div> : <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-800">This donor is not linked to a patient request yet. Create a request first.</div>}

              <div>
                  <label className="block text-[#5A1827] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-[#990000]" /> Message
                </label>
                <textarea 
                  rows="3" 
                  required={Boolean(selectedRequest)}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-white border-2 border-[#5A1827]/30 rounded-xl p-2.5 text-[#5A1827] font-bold focus:outline-none focus:border-[#5A1827] shadow-inner resize-none text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#5A1827]/10 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#5A1827] font-bold uppercase tracking-wider border-2 border-[#5A1827]/30 hover:bg-slate-100 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                
                <button 
                  type="submit" 
                  disabled={emailLoading || !selectedRequest}
                  className="px-5 py-2 bg-[#5A1827] hover:bg-[#4A121F] text-[#E5C158] font-black uppercase tracking-widest rounded-2xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md border border-[#E5C158]/50 disabled:opacity-50 text-xs"
                >
                  <Send className="w-3.5 h-3.5" /> {emailLoading ? 'Sending Email...' : 'Send Email Alert'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default GeoPulseRadar;
