import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Users, CheckCircle, XCircle, Clock, AlertCircle, Truck } from 'lucide-react';

const PatientRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    // 1. Fetch initial patient requests
    fetch('http://localhost:5000/api/patient-requests')
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error('Error fetching patient requests:', err));

    // 2. Real-time Socket Listeners
    const handleNewRequest = (data) => setRequests((prev) => [data, ...prev]);
    const handleUpdateRequest = (updatedItem) => {
      setRequests((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
      );
    };

    if (!socket.connected) socket.connect();

    socket.on('new_patient_request', handleNewRequest);
    socket.on('update_patient_request', handleUpdateRequest);

    return () => {
      socket.off('new_patient_request', handleNewRequest);
      socket.off('update_patient_request', handleUpdateRequest);
    };
  }, []); 

  const handleApprove = async (id) => {
    try {
        setLoadingId(id);
        const res = await fetch(`http://localhost:5000/api/patient-requests/approve/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.message || 'Approval failed!');
            return;
        }
        
        setRequests((prev) => prev.map((item) => item._id === id ? data.request : item));
        alert(data.message || 'Request approved successfully!');
    } catch (err) {
        console.error('Error approving request:', err);
        alert('Network or Server error during approval');
    } finally {
        setLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
        setLoadingId(id);
        const res = await fetch(`http://localhost:5000/api/patient-requests/reject/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.message || 'Rejection failed!');
            return;
        }
        
        alert('Request rejected successfully!');
    } catch (err) {
        console.error('Error rejecting request:', err);
        alert('Network or Server error during rejection');
    } finally {
        setLoadingId(null);
    }
  };

  const handleDispatch = async (id) => {
    try {
        setLoadingId(id);
        const res = await fetch(`http://localhost:5000/api/patient-requests/dispatch/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.message || 'Dispatch failed!');
            return;
        }
        
        setRequests((prev) => prev.map((item) => item._id === id ? data.request : item));
        alert(data.message || 'Blood request dispatched successfully and live tracking activated!');
    } catch (err) {
        console.error('Error dispatching request:', err);
        alert('Network or Server error during dispatch');
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div className="w-full px-4 py-4 space-y-6 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      
      {/* Main Container - Spread Full Width */}
      <div className="bg-white border-2 border-[#5A1827]/30 rounded-2xl p-6 shadow-md space-y-6 w-full">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[#5A1827]/15 pb-4 gap-4">
          <div>
            <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
              Patient Management
            </span>
            <h2 className="text-3xl font-black text-[#5A1827] flex items-center gap-2.5 mt-2">
              <Users className="text-rose-600 w-7 h-7" /> Patient Blood Requests
            </h2>
            <p className="text-sm text-slate-600 font-medium mt-1">
              Review and manage incoming blood requests from patients in real-time.
            </p>
          </div>

          {/* Chamakdar Gold Total Requests Counter */}
          <div className="text-sm text-[#5A1827] font-bold flex items-center gap-2 bg-[#FAF9F6] px-4 py-2 rounded-xl border-2 border-[#5A1827]/20 shadow-sm">
            Total Requests:{' '}
            <span className="text-amber-950 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] border-2 border-[#D97706] px-3.5 py-1 rounded-xl font-black text-base shadow-md inline-block tracking-wide">
              {requests.length}
            </span>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto rounded-xl border border-[#5A1827]/20">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="bg-[#FAF9F6] border-b border-[#5A1827]/20 text-[#5A1827] uppercase text-xs font-black tracking-wider">
              <tr>
                <th className="py-4 px-5">Patient Name</th>
                <th className="py-4 px-5">Hospital</th>
                <th className="py-4 px-5">Blood Group</th>
                <th className="py-4 px-5">Units</th>
                <th className="py-4 px-5">Contact</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5A1827]/10 font-semibold">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 italic font-medium">
                    <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2 opacity-80" />
                    No patient blood requests found.
                  </td>
                </tr>
              ) : (
                requests.map((row) => {
                  const isProcessing = loadingId === row._id;

                  return (
                    <tr key={row._id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                      <td className="py-4 px-5 font-black text-[#5A1827]">{row.patientName}</td>
                      <td className="py-4 px-5 text-slate-700">{row.hospitalName}</td>
                      <td className="py-4 px-5">
                        <span className="px-3 py-1 font-black text-xs text-rose-700 bg-rose-100 border border-rose-300 rounded-lg shadow-sm inline-block">
                          {row.bloodGroup}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-black text-amber-800">{row.unitsRequired}</td>
                      <td className="py-4 px-5 text-slate-600 font-medium text-xs">{row.contactPhone}</td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black ${
                            row.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : row.status === 'Dispatched'
                              ? 'bg-rose-100 text-[#5A1827] border border-[#5A1827]/30'
                              : row.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {row.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />}
                          {row.status === 'Dispatched' && <Truck className="w-3.5 h-3.5 text-[#5A1827]" />}
                          {row.status === 'Rejected' && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
                          {row.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2">
                          {row.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleApprove(row._id)}
                                disabled={isProcessing}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md uppercase tracking-wider"
                              >
                                {isProcessing ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(row._id)}
                                disabled={isProcessing}
                                className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-black rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md uppercase tracking-wider"
                              >
                                {isProcessing ? '...' : 'Reject'}
                              </button>
                            </>
                          ) : row.status === 'Approved' ? (
                            /* 👉 Ab yeh button maroon theme (#5A1827) ke mutabiq ho gaya hai */
                            <button
                              onClick={() => handleDispatch(row._id)}
                              disabled={isProcessing}
                              className="px-3.5 py-2 bg-[#5A1827] hover:bg-[#43121d] text-white text-xs font-black rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-1 border border-[#E5C158]/40"
                            >
                              {isProcessing ? '...' : '🚚 Dispatch'}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                              Processed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default PatientRequests;