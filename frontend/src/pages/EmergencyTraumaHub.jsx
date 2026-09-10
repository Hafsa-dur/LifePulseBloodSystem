import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { AlertCircle, Send, ShieldAlert } from 'lucide-react';
import { API_URL } from '../api';

const EmergencyTraumaHub = () => {
  const [cases, setCases] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    // 1. Fetch initial requests
    fetch(`${API_URL}/hospital-requests`)
      .then((res) => res.json())
      .then((data) => setCases(data))
      .catch((err) => console.error('Error loading requests:', err));

    // 2. Real-time Listeners
    const handleNewRequest = (data) => setCases((prev) => [data, ...prev]);
    const handleDeleteRequest = (deletedId) => {
      setCases((prev) => prev.filter((item) => (item._id || item.id) !== deletedId));
    };

    if (!socket.connected) socket.connect();

    socket.on('new_hospital_request', handleNewRequest);
    socket.on('delete_hospital_request', handleDeleteRequest);

    return () => {
      socket.off('new_hospital_request', handleNewRequest);
      socket.off('delete_hospital_request', handleDeleteRequest);
    };
  }, []);

  const handleDispatchAndResolve = async (item) => {
    const itemId = item._id || item.id;
    try {
      setProcessingId(itemId);

      const dispatchRes = await fetch(`${API_URL}/donations/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: item.hospitalName,
          bloodGroup: item.bloodGroup,
          units: Number(item.unitsRequired || 1)
        })
      });

      if (!dispatchRes.ok) {
        alert("Failed to deduct blood stock!");
        setProcessingId(null);
        return;
      }

      await fetch(`${API_URL}/hospital-requests/${itemId}`, {
        method: 'DELETE'
      });

    } catch (err) {
      console.error('Dispatch and resolve error:', err);
      alert('Error processing dispatch.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full px-4 py-4 space-y-6 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      
      <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl p-6 shadow-md space-y-6 w-full">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[#6B1D2F]/20 pb-4 gap-4">
          <div>
            <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
              Emergency Network
            </span>
            <h2 className="text-3xl font-black text-[#5A1827] flex items-center gap-2.5 mt-2">
              <ShieldAlert className="text-rose-600 w-7 h-7 animate-pulse" /> Emergency Trauma Hub
            </h2>
            <p className="text-sm text-slate-600 font-medium mt-1">
              Live hospital emergency requirements and instant blood unit dispatch control.
            </p>
          </div>
          
          {/* Chamakdar Gold Active Cases Counter */}
          <div className="text-sm text-[#5A1827] font-bold flex items-center gap-2 bg-[#FAF9F6] px-4 py-2 rounded-xl border-2 border-[#6B1D2F]/30 shadow-sm">
            Active Cases:{' '}
            <span className="text-amber-950 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] border-2 border-[#D97706] px-3.5 py-1 rounded-xl font-black text-base shadow-md inline-block tracking-wide">
              {cases.length}
            </span>
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {cases.length === 0 ? (
            <div className="text-center py-16 text-slate-500 italic font-medium bg-[#FAF9F6] rounded-2xl border-2 border-dashed border-[#6B1D2F]/30">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3 opacity-80" />
              No active emergency cases currently logged in the network.
            </div>
          ) : (
            cases.map((item) => {
              const itemId = item._id || item.id;
              const isProcessing = processingId === itemId;

              return (
                <div 
                  key={itemId} 
                  className="p-5 rounded-2xl border-2 border-[#6B1D2F]/30 bg-[#FAF9F6] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#6B1D2F] transition-all shadow-sm"
                >
                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-[#5A1827]">{item.hospitalName}</h3>
                    <p className="text-xs text-slate-700 font-semibold">
                      Required: <strong className="text-rose-700 font-black text-sm">{item.unitsRequired} Units</strong> of <strong className="text-rose-700 font-black text-sm">{item.bloodGroup}</strong>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Contact Person: <span className="text-slate-800 font-bold">{item.contactPerson}</span> ({item.phone})
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDispatchAndResolve(item)}
                    disabled={isProcessing}
                    className="w-full md:w-auto px-6 py-3 bg-[#5A1827] hover:bg-[#3D101A] text-white border border-[#E5C158]/40 text-xs font-black rounded-xl transition active:scale-95 uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-[#E5C158]" />
                    {isProcessing ? 'Dispatching Units...' : 'Dispatch & Resolve'}
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default EmergencyTraumaHub;