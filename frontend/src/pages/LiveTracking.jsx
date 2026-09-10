import React, { useState, useEffect } from 'react';
import { Truck, Thermometer, MapPin, CheckCircle2, ArrowLeft, AlertCircle, Clock, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL, parseResponse } from '../api';

const LiveTracking = () => {
  const [activeDispatch, setActiveDispatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [temperature] = useState(3.9); // Safe Biomedical Cold-chain range (2°C - 6°C)
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes delivery countdown

  useEffect(() => {
    fetch(`${API_URL}/patient-requests`)
      .then(res => parseResponse(res))
      .then(data => {
        const requests = Array.isArray(data) ? data : data.data || [];
        
        // Sirf wohi requests filter hongi jinka status 'Dispatched' ya 'In Transit' ho 
        // (Pending ya Approved yahan bilkul show nahi hongi)
        const activeRequests = requests.filter(r => 
          r.status === 'Dispatched' || r.status === 'In Transit'
        );
        
        if (activeRequests.length > 0) {
          // MongoDB ke _id ke mutabiq sabse latest dispatched record ko sabse upar laane ke liye sorting
          const sortedRequests = [...activeRequests].sort((a, b) => {
            const timeA = a._id ? parseInt(a._id.substring(0, 8), 16) : new Date(a.createdAt || 0).getTime();
            const timeB = b._id ? parseInt(b._id.substring(0, 8), 16) : new Date(b.createdAt || 0).getTime();
            return timeB - timeA; // Descending order: Newest first!
          });

          // Sabse naya dispatch kiya gaya record
          const current = sortedRequests[0];

          setActiveDispatch({
            _id: current._id,
            patientName: current.patientName || 'Patient',
            hospitalName: current.hospitalName || 'Hospital',
            bloodGroup: current.bloodGroup || 'A+',
            city: current.city || 'Peshawar',
            areaOrLocation: current.areaOrLocation || current.hospitalName || 'Hospital Emergency Unit, Peshawar',
            status: current.status,
            currentLocationNote: current.currentLocationNote || 'Dispatched securely from blood bank.'
          });
          setTimeRemaining(300);
        } else {
          // Agar koi bhi dispatch nahi hua, toh null set ho jayega
          setActiveDispatch(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching requests for tracking:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!activeDispatch || activeDispatch.status === 'Delivered') return;

    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [activeDispatch]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] flex items-center justify-center font-sans">
        <p className="text-sm font-black animate-pulse">Syncing Active Dispatches...</p>
      </div>
    );
  }

  if (!activeDispatch) {
    return (
      <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-12 px-4 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-3xl border-2 border-[#6B1D2F]/25 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-[#990000] rounded-full flex items-center justify-center mx-auto border-2 border-rose-300">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#4A1521]">No Active Dispatch Found</h2>
          <p className="text-xs text-slate-600 font-medium">
            Abhi tak kisi bhi request ko Dispatch nahi kiya gaya. Jab aap 'Dispatch' button par click karengi, tabhi yahan live tracking shuru hogi.
          </p>
          <Link 
            to="/" 
            className="inline-block w-full py-3 bg-[#5A1827] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-[#3D101A] transition-all"
          >
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#6B1D2F]/20 pb-4 bg-white p-5 rounded-2xl shadow-sm border-2">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-xl bg-white border border-[#6B1D2F]/20 hover:bg-[#6B1D2F] hover:text-white transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#4A1521] tracking-tight flex items-center gap-2">
                <Truck className="w-7 h-7 text-[#990000] animate-bounce" />
                Live Hospital Dispatch & Transit
              </h1>
              <p className="text-xs text-slate-600 font-medium">Connected directly with Patient Request database.</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider border-2 shadow-md bg-amber-100 text-[#5A1827] border-amber-400 animate-pulse">
            In Transit
          </div>
        </div>

        {/* Notification Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl shadow-md flex items-center justify-between text-amber-900">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
              Hospital Notification Active
            </span>
            <h4 className="text-sm font-black text-[#4A1521]">Blood Bag En Route to {activeDispatch.hospitalName}</h4>
            <p className="text-xs text-slate-600 font-medium">
              Patient: <strong className="text-slate-800">{activeDispatch.patientName}</strong> | Location: <strong className="text-slate-800">{activeDispatch.areaOrLocation}, {activeDispatch.city}</strong>
            </p>
          </div>
          <div className="text-right bg-white p-4 rounded-xl border border-amber-200 shadow-sm shrink-0">
            <span className="text-[10px] font-black text-slate-500 uppercase block">Estimated Arrival</span>
            <span className="text-xl font-black text-[#990000] flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-700" /> {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Patient & Hospital Details */}
          <div className="bg-white p-6 rounded-2xl border-2 border-[#6B1D2F]/20 shadow-md space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1827] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#990000]" /> Destination Details
            </span>
            <h3 className="text-lg font-black text-[#4A1521]">{activeDispatch.hospitalName}</h3>
            <p className="text-xs text-slate-600 font-medium">
              Patient Name: <strong className="text-slate-800">{activeDispatch.patientName}</strong>
            </p>
            <p className="text-xs text-slate-600 font-medium">
              City / Area: <strong className="text-slate-800">{activeDispatch.city}</strong>
            </p>
            <div className="pt-2">
              <span className="bg-rose-100 text-[#990000] px-2.5 py-1 rounded-lg text-xs font-black border border-rose-200">
                Blood Group: {activeDispatch.bloodGroup}
              </span>
            </div>
          </div>

          {/* Cold Chain IoT Card */}
          <div className="bg-white p-6 rounded-2xl border-2 border-[#6B1D2F]/20 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1827] flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-blue-600" /> Medical Cold-Chain Storage
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                IoT Active
              </span>
            </div>
            
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#4A1521]">{temperature}°C</span>
              <span className="text-xs text-slate-500 font-medium">Safe Range (2°C - 6°C)</span>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1">
              <p className="text-xs font-black text-[#4A1521] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#990000]" /> Status Note:
              </p>
              <p className="text-xs text-slate-600 font-medium">{activeDispatch.currentLocationNote}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LiveTracking;