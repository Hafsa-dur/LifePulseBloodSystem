import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, ShieldCheck, Droplet, Calendar, Clock, Pencil, Save, X } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [lastDonationDate, setLastDonationDate] = useState('N/A');
  const [nextEligibleDate, setNextEligibleDate] = useState('N/A');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'Not Specified');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUserDonations = async () => {
      try {
        const response = await axios.get(`${API_URL}/donations`, { headers: authHeaders() });
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

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ name: form.name, currentPassword: form.currentPassword, newPassword: form.newPassword })
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Profile update failed.');

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setForm({ name: data.user.name || '', currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

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
          <button type="button" onClick={() => { setEditing((current) => !current); setMessage({ type: '', text: '' }); }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5A1827] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#E5C158]">
            {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editing ? 'Cancel' : 'Change Name / Password'}
          </button>
        </div>

        {message.text && <div className={`rounded-xl border-2 px-4 py-3 text-sm font-bold ${message.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-100 text-rose-800'}`}>{message.text}</div>}

        {editing && <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border-2 border-[#6B1D2F]/30 bg-[#FAF9F6] p-5">
          <label className="text-xs font-black uppercase tracking-wider">Full Name<input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="mt-2 w-full rounded-xl border-2 border-[#6B1D2F]/30 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#5A1827]" /></label>
          <div />
          <label className="text-xs font-black uppercase tracking-wider">Current Password<input type="password" value={form.currentPassword} onChange={(event) => updateForm('currentPassword', event.target.value)} className="mt-2 w-full rounded-xl border-2 border-[#6B1D2F]/30 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#5A1827]" /></label>
          <label className="text-xs font-black uppercase tracking-wider">New Password<input type="password" minLength="6" value={form.newPassword} onChange={(event) => updateForm('newPassword', event.target.value)} className="mt-2 w-full rounded-xl border-2 border-[#6B1D2F]/30 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#5A1827]" /></label>
          <label className="text-xs font-black uppercase tracking-wider">Confirm New Password<input type="password" minLength="6" value={form.confirmPassword} onChange={(event) => updateForm('confirmPassword', event.target.value)} className="mt-2 w-full rounded-xl border-2 border-[#6B1D2F]/30 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#5A1827]" /></label>
          <button disabled={saving} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A1827] px-4 py-3 text-xs font-black uppercase tracking-wider text-[#E5C158] disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>}

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