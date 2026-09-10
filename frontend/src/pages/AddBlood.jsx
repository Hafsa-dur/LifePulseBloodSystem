import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Send, Calendar, Clock, Mail } from 'lucide-react';
import { API_URL } from '../api';

const AddBlood = () => {
  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    bloodGroup: 'A+',
    units: 1,
    lastDonationDate: '',
    nextEligibleDate: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  // Handle Last Donation Date change and automatically calculate Next Eligible Date (e.g., +56 days gap)
  const handleLastDonationChange = (e) => {
    const selectedDate = e.target.value;
    let nextDate = '';

    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      dateObj.setDate(dateObj.getDate() + 56); // Standard 56 days (8 weeks) gap for blood donation eligibility
      nextDate = dateObj.toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      lastDonationDate: selectedDate,
      nextEligibleDate: nextDate
    });
  };

  // Handle form submission and save data to database with duplicate email check logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/donations`, {
        donorName: formData.donorName,
        email: formData.email.toLowerCase().trim(),
        bloodGroup: formData.bloodGroup,
        units: Number(formData.units),
        lastDonationDate: formData.lastDonationDate || new Date(),
        nextEligibleDate: formData.nextEligibleDate,
        notes: formData.notes,
        status: 'Available',
        donationDate: new Date()
      });

      if (response.status === 200 || response.status === 201) {
        alert('Blood donation record added successfully!');
        setFormData({
          donorName: '',
          email: '',
          bloodGroup: 'A+',
          units: 1,
          lastDonationDate: '',
          nextEligibleDate: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error("Error adding blood record:", error);
      // If backend sends a duplicate key error (MongoDB error code 11000 or status 400)
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message || 'Duplicate entry or eligibility restriction found!');
      } else {
        alert('Failed to save record! This email might already exist in the database.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-4 space-y-6 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      
      {/* Main Container */}
      <div className="bg-white border-2 border-[#5A1827]/30 rounded-2xl p-6 shadow-md space-y-6 w-full">
        
        {/* Header Section */}
        <div className="border-b-2 border-[#5A1827]/15 pb-4">
          <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
            Blood Donation Form
          </span>
          <h2 className="text-3xl font-black text-[#5A1827] flex items-center gap-2.5 mt-2">
            <UserPlus className="text-rose-600 w-7 h-7" /> Add Blood Donation Record
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Register new donor contributions with unique email tracking and eligibility checks.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Donor Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Donor Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ali Khan"
              value={formData.donorName}
              onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-semibold focus:outline-none focus:border-[#5A1827] transition"
            />
          </div>

          {/* Email Address Field (Unique Identifier) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-600" /> Email Address (Unique ID)
            </label>
            <input
              type="email"
              required
              placeholder="ali.khan@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-semibold focus:outline-none focus:border-[#5A1827] transition"
            />
          </div>

          {/* Blood Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Blood Group</label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-black focus:outline-none focus:border-[#5A1827] transition"
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Units (Pints) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Units (Pints)</label>
            <input
              type="number"
              min="1"
              required
              value={formData.units}
              onChange={(e) => setFormData({ ...formData, units: e.target.value })}
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-black focus:outline-none focus:border-[#5A1827] transition"
            />
          </div>

          {/* Last Donation Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-600" /> Last Donation Date
            </label>
            <input
              type="date"
              value={formData.lastDonationDate}
              onChange={handleLastDonationChange}
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-bold focus:outline-none focus:border-[#5A1827] transition"
            />
          </div>

          {/* Next Eligible Date (Auto-calculated) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700" /> Next Eligible Date (Auto)
            </label>
            <input
              type="date"
              disabled
              value={formData.nextEligibleDate}
              placeholder="Auto-calculated (56 days gap)"
              className="w-full bg-slate-100 border-2 border-[#5A1827]/20 p-3 rounded-xl text-sm text-slate-700 font-bold focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Additional Notes */}
          <div className="col-span-1 md:col-span-2 space-y-1.5">
            <label className="text-xs font-black text-[#5A1827] uppercase tracking-wider block">Additional Notes (Optional)</label>
            <textarea
              rows="3"
              placeholder="Health notes, medical remarks, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm text-[#5A1827] font-semibold focus:outline-none focus:border-[#5A1827] transition resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="col-span-1 md:col-span-2 py-3.5 bg-[#5A1827] hover:bg-[#3D101A] disabled:opacity-50 text-white font-black rounded-xl transition active:scale-95 cursor-pointer shadow-md uppercase tracking-wider text-xs flex items-center justify-center gap-2 border border-[#E5C158]/40 mt-3"
          >
            <Send className="w-4 h-4 text-[#E5C158]" />
            {loading ? 'Validating & Saving...' : 'Save Blood Donation Record'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AddBlood;