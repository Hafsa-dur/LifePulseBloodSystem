import { useMemo, useState } from 'react';
import { UserRound, Mail, MapPin, ShieldCheck, Save } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const AccountCenter = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState({
    name: user.name || '',
    email: user.email || '',
    hospitalName: user.hospitalName || '',
    hospitalLocation: user.hospitalLocation || '',
    phone: user.phone || '',
    role: user.role || 'staff',
    password: '',
  });

  const summary = useMemo(() => [
    { label: 'Name', value: profile.name || 'Not set' },
    { label: 'Email', value: profile.email || 'Not set' },
    { label: 'Role', value: profile.role === 'staff' ? 'Staff' : 'Admin' },
    { label: 'Hospital', value: profile.hospitalName || 'Not set' },
  ], [profile]);

  const handleSave = () => {
    fetch(`${API_URL}/hospital/account`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify(profile) })
      .then(async (response) => { const data = await parseResponse(response); if (!response.ok) throw new Error(data.message || 'Unable to update profile.'); return data; })
      .then((data) => { localStorage.setItem('user', JSON.stringify({ ...user, ...data.user })); alert('Profile details saved.'); })
      .catch((error) => alert(error.message));
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E5C158]/20 border border-[#E5C158] flex items-center justify-center">
              <UserRound className="w-6 h-6 text-[#5A1827]" />
            </div>
            <div>
              <span className="px-3 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-[10px] uppercase tracking-wider rounded-full">Account Center</span>
              <h1 className="text-3xl font-black text-[#4A1521] mt-2">Hospital Account Profile</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
            <div className="space-y-4">
              {summary.map((item) => (
                <div key={item.label} className="border-b border-[#6B1D2F]/10 pb-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className="mt-1 text-base font-black text-[#4A1521]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-xl font-black text-[#4A1521]">Profile details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm font-bold text-[#4A1521]">
                <span>Full Name</span>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3 focus:outline-none focus:border-[#5A1827]" />
              </label>

              <label className="space-y-2 text-sm font-bold text-[#4A1521]">
                <span>Email</span>
                <div className="flex items-center gap-2 border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full bg-transparent focus:outline-none" />
                </div>
              </label>

              <label className="space-y-2 text-sm font-bold text-[#4A1521] md:col-span-2">
                <span>Hospital Name</span>
                <input value={profile.hospitalName} onChange={(e) => setProfile({ ...profile, hospitalName: e.target.value })} className="w-full border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3 focus:outline-none focus:border-[#5A1827]" />
              </label>

              <label className="space-y-2 text-sm font-bold text-[#4A1521] md:col-span-2">
                <span>Hospital Location</span>
                <div className="flex items-center gap-2 border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <input value={profile.hospitalLocation} onChange={(e) => setProfile({ ...profile, hospitalLocation: e.target.value })} className="w-full bg-transparent focus:outline-none" />
                </div>
              </label>

              <label className="space-y-2 text-sm font-bold text-[#4A1521] md:col-span-2">
                <span>Phone</span>
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3 focus:outline-none focus:border-[#5A1827]" />
              </label>

              <label className="space-y-2 text-sm font-bold text-[#4A1521] md:col-span-2">
                <span>New Password (optional)</span>
                <input type="password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} className="w-full border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3 focus:outline-none focus:border-[#5A1827]" />
              </label>
            </div>

            <button onClick={handleSave} className="mt-6 inline-flex items-center gap-2 bg-[#5A1827] text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl shadow-md hover:bg-[#3D101A] transition-colors">
              <Save className="w-4 h-4" /> Save profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountCenter;
