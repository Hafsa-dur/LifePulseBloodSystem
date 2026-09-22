import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL, parseResponse } from '../api';
import { GoogleLogin } from '@react-oauth/google';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('donor');
  const [hospitals, setHospitals] = useState([]);
  const [mode, setMode] = useState('existing');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', bloodGroup: 'O+', phone: '',
    hospitalId: '', hospitalName: '', hospitalLocation: '', token: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (role !== 'donor') {
      fetch(`${API_URL}/hospital/directory`)
        .then(parseResponse)
        .then((data) => setHospitals(data.hospitals || []))
        .catch(() => setHospitals([]));
    }
  }, [role]);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) navigate(`/staff-registration?token=${encodeURIComponent(token)}`, { replace: true });
  }, [navigate, searchParams]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleGoogleSuccess = async ({ credential }) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          role,
          phone: form.phone,
          hospitalId: mode === 'existing' ? form.hospitalId : '',
          hospitalName: mode === 'new' ? form.hospitalName : '',
          hospitalLocation: mode === 'new' ? form.hospitalLocation : ''
        })
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Google registration failed.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(role === 'donor' ? '/profile' : '/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (role === 'hospital_staff' && !form.token) return setError('Hospital Staff registration requires an Admin invitation token/link.');

    setLoading(true);
    try {
      let endpoint = `${API_URL}/auth/register`;
      let body = { name: form.name, email: form.email, password: form.password, phone: form.phone, role: 'donor', bloodGroup: form.bloodGroup };

      if (role === 'hospital_admin') {
        endpoint = `${API_URL}/hospital/onboard`;
        body = { name: form.name, email: form.email, password: form.password, phone: form.phone, hospitalId: mode === 'existing' ? form.hospitalId : '', hospitalName: mode === 'new' ? form.hospitalName : '', hospitalLocation: mode === 'new' ? form.hospitalLocation : '' };
      } else if (role === 'hospital_staff') {
        endpoint = `${API_URL}/auth/staff/register`;
        body = { token: form.token, name: form.name, email: form.email, password: form.password, phone: form.phone };
      }

      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await parseResponse(response);
      if (role === 'hospital_staff' && data.accepted) {
        navigate(`/staff-registration?token=${encodeURIComponent(form.token)}`, { replace: true });
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Registration failed.');
      if (data.pendingVerification) {
        localStorage.setItem('pendingVerificationEmail', form.email.trim().toLowerCase());
        navigate('/email-verification-pending', { replace: true, state: { email: form.email.trim().toLowerCase() } });
        return;
      }
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(role === 'donor' ? '/profile' : '/dashboard', { replace: true });
      } else {
        navigate('/login');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const showHospitalFields = role === 'hospital_admin';
  const isStaff = role === 'hospital_staff';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-2xl space-y-6 bg-white p-8 rounded-3xl shadow-2xl border-2 border-[#5A1827]/20">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#5A1827]">Create an Account</h1>
          <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Choose the account type that matches your LifePulse access.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[['donor', 'Donor'], ['hospital_admin', 'Hospital Admin'], ['hospital_staff', 'Hospital Staff']].map(([value, label]) => (
            <button type="button" key={value} onClick={() => setRole(value)} className={`rounded-xl border-2 px-3 py-3 text-xs font-black uppercase ${role === value ? 'bg-[#5A1827] text-white border-[#5A1827]' : 'bg-[#FAF9F6] text-[#5A1827] border-[#5A1827]/20'}`}>{label}</button>
          ))}
        </div>

        {error && <div className="rounded-xl border-2 border-rose-300 bg-rose-100 px-4 py-3 text-xs font-bold text-rose-800">{error}</div>}
        {success && <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">{success}</div>}
        {isStaff && <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">Hospital Staff accounts are created only through a Hospital Admin invitation. Paste the token from your invitation link below.</div>}

        {showHospitalFields && <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMode('existing')} className={`rounded-xl border-2 p-3 text-xs font-black uppercase ${mode === 'existing' ? 'bg-[#5A1827] text-white border-[#5A1827]' : 'border-[#5A1827]/20'}`}>Existing Hospital</button>
          <button type="button" onClick={() => setMode('new')} className={`rounded-xl border-2 p-3 text-xs font-black uppercase ${mode === 'new' ? 'bg-[#5A1827] text-white border-[#5A1827]' : 'border-[#5A1827]/20'}`}>Create New Hospital</button>
        </div>}

        {role !== 'hospital_staff' && import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="flex justify-center"><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google authentication failed.')} useOneTap={false} /></div>}
        {role !== 'hospital_staff' && import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="text-center text-xs font-black uppercase tracking-wider text-slate-400">Or use the form below</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Full name" value={form.name} onChange={(event) => update('name', event.target.value)} className="field" />
          <input required type="email" placeholder="Email address" value={form.email} onChange={(event) => update('email', event.target.value)} className="field" />
          <input required minLength="6" type="password" placeholder="Password" value={form.password} onChange={(event) => update('password', event.target.value)} className="field" />
          <input required minLength="6" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} className="field" />
          {role === 'donor' && <select value={form.bloodGroup} onChange={(event) => update('bloodGroup', event.target.value)} className="field">{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select>}
          <input placeholder="Phone (optional)" value={form.phone} onChange={(event) => update('phone', event.target.value)} className="field" />
          {showHospitalFields && (mode === 'existing' ? <select required value={form.hospitalId} onChange={(event) => update('hospitalId', event.target.value)} className="field"><option value="">Select hospital</option>{hospitals.map((hospital) => <option key={hospital.hospitalId} value={hospital.hospitalId}>{hospital.name} · {hospital.location}</option>)}</select> : <><input required placeholder="New hospital name" value={form.hospitalName} onChange={(event) => update('hospitalName', event.target.value)} className="field" /><input required placeholder="Hospital location" value={form.hospitalLocation} onChange={(event) => update('hospitalLocation', event.target.value)} className="field" /></>)}
          {isStaff && <input required placeholder="Invitation token" value={form.token} onChange={(event) => update('token', event.target.value)} className="field md:col-span-2" />}
          <button disabled={loading} className="md:col-span-2 rounded-xl bg-[#5A1827] py-3 text-xs font-black uppercase tracking-widest text-[#E5C158] disabled:opacity-50">{loading ? 'Creating account...' : role === 'hospital_admin' ? 'Create Hospital Admin' : role === 'hospital_staff' ? 'Complete Staff Registration' : 'Register as Donor'}</button>
        </form>

        <div className="text-center text-xs font-bold text-slate-500 pt-4 border-t-2 border-[#5A1827]/10">Already registered? <Link to="/login" className="font-black text-[#990000] hover:underline">Sign in</Link></div>
      </div>
      <style>{`.field{width:100%;border:2px solid rgba(90,24,39,.2);background:#FAF9F6;border-radius:.75rem;padding:.75rem;font-size:.875rem;font-weight:600;color:#5A1827;outline:none}.field:focus{border-color:#5A1827}`}</style>
    </div>
  );
};

export default Register;
