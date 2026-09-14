import { useEffect, useState } from 'react';
import { Building2, ShieldCheck } from 'lucide-react';
import { API_URL, parseResponse } from '../api';

const HospitalOnboarding = () => {
  const [hospitals, setHospitals] = useState([]);
  const [mode, setMode] = useState('existing');
  const [form, setForm] = useState({ name: '', email: '', password: '', hospitalId: '', hospitalName: '', hospitalLocation: '', contactPhone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/hospital/directory`).then(parseResponse).then((data) => setHospitals(data.hospitals || [])).catch(() => setHospitals([]));
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/hospital/onboard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...(mode === 'existing' ? { hospitalName: '', hospitalLocation: '' } : { hospitalId: '' }) }) });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Hospital onboarding failed.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center py-12 px-4 font-sans">
      <div className="max-w-3xl w-full bg-white p-8 rounded-3xl shadow-2xl border-2 border-[#5A1827]/20">
        <div className="flex items-center gap-3 border-b-2 border-[#5A1827]/10 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#E5C158]/20 border border-[#E5C158] flex items-center justify-center"><Building2 className="w-6 h-6 text-[#5A1827]" /></div>
          <div><p className="text-[10px] font-black uppercase tracking-widest text-[#7A6305]">Hospital Onboarding</p><h1 className="text-3xl font-black text-[#5A1827]">Create Hospital Admin</h1></div>
        </div>
        <p className="mt-4 text-sm text-slate-600">Select an existing hospital or create a new hospital organization before creating its admin account.</p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button type="button" onClick={() => setMode('existing')} className={`p-3 rounded-xl font-black text-xs uppercase border-2 ${mode === 'existing' ? 'bg-[#5A1827] text-white border-[#5A1827]' : 'bg-[#FAF9F6] border-[#5A1827]/20 text-[#5A1827]'}`}>Existing Hospital</button>
          <button type="button" onClick={() => setMode('new')} className={`p-3 rounded-xl font-black text-xs uppercase border-2 ${mode === 'new' ? 'bg-[#5A1827] text-white border-[#5A1827]' : 'bg-[#FAF9F6] border-[#5A1827]/20 text-[#5A1827]'}`}>Create New Hospital</button>
        </div>
        {error && <p className="mt-4 p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 text-sm font-bold">{error}</p>}
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <input required placeholder="Admin full name" value={form.name} onChange={(event) => update('name', event.target.value)} className="field" />
          <input required type="email" placeholder="Admin email" value={form.email} onChange={(event) => update('email', event.target.value)} className="field" />
          <input required minLength="6" type="password" placeholder="Admin password" value={form.password} onChange={(event) => update('password', event.target.value)} className="field" />
          {mode === 'existing' ? <select required value={form.hospitalId} onChange={(event) => update('hospitalId', event.target.value)} className="field"><option value="">Select hospital</option>{hospitals.map((hospital) => <option key={hospital.hospitalId} value={hospital.hospitalId}>{hospital.name} · {hospital.location}</option>)}</select> : <><input required placeholder="New hospital name" value={form.hospitalName} onChange={(event) => update('hospitalName', event.target.value)} className="field" /><input required placeholder="Hospital location" value={form.hospitalLocation} onChange={(event) => update('hospitalLocation', event.target.value)} className="field" /></>}
          <input placeholder="Admin phone" value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} className="field" />
          <button disabled={loading} className="md:col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#5A1827] text-white font-black uppercase text-xs disabled:opacity-50"><ShieldCheck className="w-4 h-4 text-[#E5C158]" />{loading ? 'Creating...' : 'Create Admin Account'}</button>
        </form>
      </div>
      <style>{`.field{width:100%;border:2px solid rgba(90,24,39,.2);background:#FAF9F6;border-radius:.75rem;padding:.75rem;font-size:.875rem;font-weight:600;color:#5A1827;outline:none}.field:focus{border-color:#5A1827}`}</style>
    </div>
  );
};

export default HospitalOnboarding;
