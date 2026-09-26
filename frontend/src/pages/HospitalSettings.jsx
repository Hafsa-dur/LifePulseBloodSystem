import { useEffect, useState } from 'react';
import { Activity, Database, HardDrive, Phone, Save, Settings, ShieldCheck, Users } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const emptySettings = { emergencyAlerts: true, autoDispatch: true, donorNotifications: true, emergencyContact: '', ambulanceContact: '', hospitalName: '', hospitalLocation: '' };
const displayValue = (value) => value || 'Not Available';
const formatTimestamp = (value) => value ? new Date(value).toLocaleString() : 'Not Available';

const HospitalSettings = () => {
  const [settings, setSettings] = useState(emptySettings);
  const [health, setHealth] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const responses = await Promise.all([
          fetch(`${API_URL}/hospital/settings`, { headers: authHeaders() }),
          fetch(`${API_URL}/hospital/system-health`, { headers: authHeaders() }),
          fetch(`${API_URL}/hospital/staff`, { headers: authHeaders() })
        ]);
        const [settingsResponse, healthResponse] = responses;
        const [settingsData, healthData, staffData] = await Promise.all(responses.map(parseResponse));
        if (!settingsResponse.ok) throw new Error(settingsData.message || 'System settings unavailable.');
        if (!healthResponse.ok) throw new Error(healthData.message || 'System health unavailable.');
        setSettings({ ...emptySettings, ...(settingsData.settings || {}) });
        setHealth(healthData);
        setStaff(staffData.staff || []);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const staffRefresh = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/hospital/staff`, { headers: authHeaders() });
        const data = await parseResponse(response);
        if (response.ok) setStaff(data.staff || []);
      } catch (error) {
        console.error('Could not refresh staff duty status:', error);
      }
    }, 15_000);
    return () => window.clearInterval(staffRefresh);
  }, []);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/hospital/settings`, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(settings) });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Settings could not be saved.');
      setSettings({ ...emptySettings, ...(data.settings || {}) });
      setMessage('Emergency contacts and preferences saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDuty = async (member) => {
    const dutyStatus = member.dutyStatus === 'on_duty' ? 'off_duty' : 'on_duty';
    const response = await fetch(`${API_URL}/hospital/staff/${member._id}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ dutyStatus }) });
    const data = await parseResponse(response);
    if (!response.ok) return setMessage(data.message || 'Duty status could not be updated.');
    setStaff((items) => items.map((item) => item._id === member._id ? data.staff : item));
  };

  if (loading) return <div className="min-h-screen p-8 font-black text-[#4A1521]">Loading system data...</div>;

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3"><Settings className="w-8 h-8 text-[#990000]" /><div><p className="text-[10px] font-black uppercase tracking-widest text-[#7A6305]">Administration</p><h1 className="text-3xl font-black">System &amp; Data Management</h1></div></div>
          {message && <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{message}</p>}
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'MongoDB', value: health?.database?.status || 'Not Available', icon: Database },
            { label: 'Backend API', value: health?.api?.status || 'Not Available', icon: Activity },
            { label: 'System service', value: health?.service?.status || 'Not Available', icon: ShieldCheck },
            { label: 'Last health check', value: formatTimestamp(health?.checkedAt), icon: HardDrive }
          ].map(({ label, value, icon: Icon }) => <div key={label} className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-5 shadow-sm"><Icon className="w-5 h-5 text-[#990000]" /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-lg font-black">{value}</p></div>)}
        </section>

        <section className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md"><div className="flex items-center gap-3 mb-5"><HardDrive className="w-6 h-6 text-[#990000]" /><div><h2 className="text-xl font-black">Backup Management</h2><p className="text-sm text-slate-500">Only configured backup services appear here.</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><p className="label-text">Status</p><p className="value-text">{health?.backup?.configured ? 'Configured' : 'Backup not configured'}</p></div><div><p className="label-text">Last successful backup</p><p className="value-text">{formatTimestamp(health?.backup?.lastSuccessfulAt)}</p></div><div><p className="label-text">History</p><p className="value-text">{health?.backup?.history?.length ? `${health.backup.history.length} records` : 'Not Available'}</p></div></div></section>

        <form onSubmit={saveSettings} className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md space-y-5"><div className="flex items-center gap-3"><Phone className="w-6 h-6 text-[#990000]" /><div><h2 className="text-xl font-black">Emergency Contacts</h2><p className="text-sm text-slate-500">Saved for this hospital only.</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="label-text">Emergency Contact<input value={settings.emergencyContact} onChange={(event) => setSettings({ ...settings, emergencyContact: event.target.value })} className="input-field" placeholder="Not Configured" /></label><label className="label-text">Ambulance Contact<input value={settings.ambulanceContact} onChange={(event) => setSettings({ ...settings, ambulanceContact: event.target.value })} className="input-field" placeholder="Not Configured" /></label></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[['emergencyAlerts', 'Emergency alerts'], ['autoDispatch', 'Auto-dispatch guard'], ['donorNotifications', 'Donor notifications']].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border border-[#6B1D2F]/10 bg-[#FAF9F6] p-3 text-sm font-bold">{label}<input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} /></label>)}</div><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#5A1827] px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save settings'}</button></form>

        <section className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md"><div className="flex items-center gap-3 mb-5"><Users className="w-6 h-6 text-[#990000]" /><div><h2 className="text-xl font-black">On-Duty Staff</h2><p className="text-sm text-slate-500">Existing Hospital Staff accounts only.</p></div></div><div className="space-y-3">{staff.length ? staff.map((member) => <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#6B1D2F]/10 bg-[#FAF9F6] p-4"><div><p className="font-black">{displayValue(member.name)}</p><p className="text-sm text-slate-500">Hospital Staff · {displayValue(member.email)}</p></div><button type="button" onClick={() => toggleDuty(member)} className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${member.dutyStatus === 'on_duty' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{member.dutyStatus === 'on_duty' ? 'On Duty' : 'Off Duty'}</button></div>) : <p className="text-sm text-slate-500">No Hospital Staff accounts found.</p>}</div></section>
      </div>
      <style>{`.label-text{display:block;font-size:.7rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.value-text{margin-top:.5rem;font-size:1rem;font-weight:900}.input-field{display:block;width:100%;margin-top:.4rem;border:2px solid rgba(107,29,47,.2);border-radius:.75rem;background:#FAF9F6;padding:.75rem;font-size:.875rem;color:#4A1521}`}</style>
    </div>
  );
};

export default HospitalSettings;
