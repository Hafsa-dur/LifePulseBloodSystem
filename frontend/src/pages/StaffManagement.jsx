import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, BriefcaseMedical, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const StaffManagement = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = Array.isArray(user.permissions) && user.permissions.length
    ? user.permissions
    : ['dashboard', 'requests', 'dispatch', 'reports'];

  const normalizedUserRole = String(user.role || 'donor').trim().toLowerCase();
  const roleLabel = normalizedUserRole === 'hospital_staff' || normalizedUserRole === 'staff' ? 'Hospital Staff' : 'Administrator';
  const hospitalName = user.hospitalName || 'Current Hospital';
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState({ name: '', email: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [inviteStatus, setInviteStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch(`${API_URL}/hospital/staff`, { headers: authHeaders() })
      .then(parseResponse)
      .then((data) => { if (data.staff) setStaff(data.staff); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateInvitation = async (event) => {
    event.preventDefault();
    setInviteStatus({ type: '', text: '' });
    const response = await fetch(`${API_URL}/hospital/staff/invite`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(invite)
    });
    const data = await parseResponse(response);
    if (!response.ok) {
      setInviteStatus({ type: 'error', text: data.message || 'Unable to create staff invitation.' });
      return;
    }
    setInviteLink(data.invitation?.inviteLink || '');
    setInviteStatus({ type: 'success', text: data.message || 'Invitation sent successfully.' });
    setInvite({ name: '', email: '' });
  };

  const toggleStaff = async (member) => {
    const response = await fetch(`${API_URL}/hospital/staff/${member._id}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ isActive: !member.isActive }) });
    const data = await parseResponse(response);
    if (response.ok) setStaff((items) => items.map((item) => item._id === member._id ? data.staff : item));
  };

  const removeStaff = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this hospital?`)) return;
    const response = await fetch(`${API_URL}/hospital/staff/${member._id}`, { method: 'DELETE', headers: authHeaders() });
    if (response.ok) setStaff((items) => items.filter((item) => item._id !== member._id));
  };

  const accessibilitySummary = useMemo(() => {
    return [
      { label: 'Hospital', value: hospitalName },
      { label: 'Role', value: roleLabel },
      { label: 'Access Level', value: permissions.length > 0 ? 'Authorized' : 'Limited' },
      { label: 'Status', value: user.isActive === false ? 'Inactive' : 'Active' },
    ];
  }, [hospitalName, permissions.length, roleLabel, user.isActive]);

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
          <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
            <div>
              <span className="px-3 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-[10px] uppercase tracking-wider rounded-full">
                Staff Access Control
              </span>
              <h1 className="text-3xl font-black text-[#4A1521] mt-3 flex items-center gap-3">
                <Users className="w-7 h-7 text-[#990000]" />
                Staff Management
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black text-emerald-700">Secure hospital access</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {accessibilitySummary.map((item) => (
            <div key={item.label} className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.label}</p>
              <p className="mt-3 text-lg font-black text-[#4A1521]">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseMedical className="w-5 h-5 text-[#990000]" />
              <h2 className="text-xl font-black text-[#4A1521]">Operational privileges</h2>
            </div>

            <div className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission} className="flex items-center justify-between border border-[#6B1D2F]/10 rounded-xl p-3 bg-[#FAF9F6]">
                  <span className="text-sm font-bold text-[#4A1521] capitalize">{permission.replace('-', ' ')}</span>
                  <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-700" />
              <h2 className="text-xl font-black text-[#4A1521]">Compliance note</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <p>Staff access follows the active hospital scope stored with the logged-in account. Requests, dispatches, and emergency workflows remain tied to the current hospital context.</p>
              <p className="bg-[#FDF4D7] border border-[#E5C158] rounded-xl p-3 text-[#7A6305] font-bold">
                Role-based access is enforced at the route layer and by hospital-scoped MongoDB filters.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-black text-[#4A1521] mb-4">Hospital team</h2>
          {normalizedUserRole === 'hospital_admin' || normalizedUserRole === 'admin' ? (
            <>
              <form onSubmit={generateInvitation} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
                <input type="text" required placeholder="Staff name" value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} className="border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3 text-sm" />
                <input type="email" required placeholder="Invite email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} className="border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl p-3 text-sm" />
                <input type="text" value="24 hours" readOnly className="border-2 border-[#6B1D2F]/20 bg-slate-100 rounded-xl p-3 text-sm font-bold" />
                <input type="text" value="Hospital Staff" readOnly className="border-2 border-[#6B1D2F]/20 bg-slate-100 rounded-xl p-3 text-sm font-bold" />
                <button className="bg-[#E5C158] text-[#5A1827] rounded-xl font-black text-xs uppercase">Generate Invite</button>
              </form>
              {inviteStatus.text && <div className={`mb-5 rounded-xl border p-3 text-xs font-bold ${inviteStatus.type === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>{inviteStatus.text}</div>}
              {inviteLink && <div className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-bold break-all">Invite link: {inviteLink}</div>}
            </>
          ) : null}
          <div className="space-y-2">
            {!loading && staff.map((member) => <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#6B1D2F]/10 rounded-xl p-3 bg-[#FAF9F6]">
              <div><p className="font-black text-[#4A1521]">{member.name}</p><p className="text-xs text-slate-500">Hospital Staff · {member.email} {member.phone ? `· ${member.phone}` : ''}</p></div>
              <div className="flex items-center gap-2"><button onClick={() => toggleStaff(member)} className={`px-3 py-2 rounded-lg text-xs font-black ${member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{member.isActive ? 'Active' : 'Inactive'}</button>{(normalizedUserRole === 'hospital_admin' || normalizedUserRole === 'admin') && <button onClick={() => removeStaff(member)} className="px-3 py-2 rounded-lg text-xs font-black bg-rose-100 text-rose-700">Remove</button>}</div>
            </div>)}
            {!loading && staff.length === 0 && <p className="text-sm text-slate-500">No staff accounts found for this hospital.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
