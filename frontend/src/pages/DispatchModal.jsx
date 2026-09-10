import React, { useState } from 'react';
import axios from 'axios';
import { Radio, X, Building2, Droplet, Hash, Calendar, Clock, User } from 'lucide-react';
import { API_URL } from '../api';


const DispatchModal = ({ isOpen, onClose, onSuccess }) => {
  const [hospital, setHospital] = useState('');
  const [patientName, setPatientName] = useState(''); // Added Patient Name field
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [units, setUnits] = useState(1);
  
  // Exact Date and Time states (defaulting to current local date & time)
  const getCurrentDateTime = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    return { dateStr, timeStr };
  };

  const initialDT = getCurrentDateTime();
  const [dispatchDate, setDispatchDate] = useState(initialDT.dateStr);
  const [dispatchTime, setDispatchTime] = useState(initialDT.timeStr);
  
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDispatch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('${API_URL}/api/donations/dispatch', {
        hospitalName: hospital,
        patientName: patientName, // Sending exact patient name
        bloodGroup,
        units: Number(units),
        dispatchDate: dispatchDate, // Exact Date
        dispatchTime: dispatchTime  // Exact Time
      });

      alert('Blood units and exact dispatch records saved successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error dispatching blood:', error);
      alert(error.response?.data?.message || 'Failed to dispatch blood units');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Creamy/White Background with Rich Maroon Border */}
      <div className="bg-[#FAF9F6] border-2 border-[#5A1827] rounded-2xl p-6 w-full max-w-md text-[#5A1827] shadow-2xl relative font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b-2 border-[#5A1827]/15 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#990000] animate-pulse" />
            <h2 className="text-xl font-black text-[#5A1827]">Dispatch Blood Units & Log</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#5A1827]/30 text-[#5A1827] hover:bg-rose-100 hover:text-rose-900 transition font-black cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleDispatch} className="space-y-3.5">
          
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

          {/* Patient Name (Mandatory & Exact) */}
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
                <Droplet className="w-3.5 h-3.5 text-[#990000]" /> Blood Group
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
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#5A1827] font-bold text-xs uppercase tracking-wider border-2 border-[#5A1827]/30 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-white font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#5A1827] to-[#802035] hover:from-[#3D101A] hover:to-[#5A1827] border border-[#E5C158]/50 shadow-md active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? 'Processing...' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default DispatchModal;