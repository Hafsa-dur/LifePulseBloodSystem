import React, { useState } from 'react';
import { Building2, Send, AlertCircle } from 'lucide-react';
import { API_URL } from '../api';

const HospitalEmergencyForm = () => {
  const [formData, setFormData] = useState({
    hospitalName: '',
    bloodGroup: 'O+',
    unitsRequired: 1,
    urgencyLevel: 'Critical',
    contactPerson: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/hospital-requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          unitsRequired: Number(formData.unitsRequired)
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        alert('✅ Emergency Request Live Broadcasted!');
        setFormData({
          hospitalName: '',
          bloodGroup: 'O+',
          unitsRequired: 1,
          urgencyLevel: 'Critical',
          contactPerson: '',
          phone: ''
        });
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Failed to send broadcast. Check browser console & Express server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-4 space-y-6 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      
      {/* Main Container - Spread Full Width */}
      <div className="bg-white border-2 border-[#5A1827]/30 rounded-2xl p-6 shadow-md space-y-6 w-full">
        
        {/* Header Section */}
        <div className="border-b-2 border-[#5A1827]/15 pb-4">
          <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
            Requisition Portal
          </span>
          <h2 className="text-3xl font-black text-[#5A1827] flex items-center gap-2.5 mt-2">
            <Building2 className="text-rose-600 w-7 h-7" /> Hospital Emergency Requisition
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Fill out the emergency details below to live broadcast blood requirements to the network.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Hospital Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Lady Reading Hospital"
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-semibold focus:outline-none focus:border-[#5A1827] transition"
              value={formData.hospitalName}
              onChange={(e) => setFormData((prev) => ({ ...prev, hospitalName: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Contact Person</label>
            <input
              required
              type="text"
              placeholder="e.g. Dr. Ahmed"
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-semibold focus:outline-none focus:border-[#5A1827] transition"
              value={formData.contactPerson}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Blood Group</label>
            <select
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-black focus:outline-none focus:border-[#5A1827] transition"
              value={formData.bloodGroup}
              onChange={(e) => setFormData((prev) => ({ ...prev, bloodGroup: e.target.value }))}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Units Required</label>
            <input
              type="number"
              min="1"
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-black focus:outline-none focus:border-[#5A1827] transition"
              value={formData.unitsRequired}
              onChange={(e) => setFormData((prev) => ({ ...prev, unitsRequired: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Urgency Level</label>
            <select
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-bold focus:outline-none focus:border-[#5A1827] transition"
              value={formData.urgencyLevel}
              onChange={(e) => setFormData((prev) => ({ ...prev, urgencyLevel: e.target.value }))}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Phone Number</label>
            <input
              required
              type="text"
              placeholder="e.g. 03001234567"
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-semibold focus:outline-none focus:border-[#5A1827] transition"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="col-span-1 md:col-span-2 py-3.5 bg-[#5A1827] hover:bg-[#3D101A] disabled:opacity-50 text-white font-black rounded-xl transition active:scale-95 cursor-pointer shadow-md uppercase tracking-wider text-xs flex items-center justify-center gap-2 border border-[#E5C158]/40 mt-3"
          >
            <Send className="w-4 h-4 text-[#E5C158]" />
            {loading ? 'Broadcasting Request...' : 'Broadcast Request Live'}
          </button>

        </form>

      </div>
    </div>
  );
};

export default HospitalEmergencyForm;