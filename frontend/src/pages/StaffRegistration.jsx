import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL, parseResponse } from '../api';

const StaffRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token') || '';

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return setStatus({ type: 'error', text: 'A valid staff invitation link is required.' });
    if (form.password !== form.confirmPassword) return setStatus({ type: 'error', text: 'Passwords do not match.' });

    setLoading(true);
    setStatus({ type: '', text: '' });
    try {
      const response = await fetch(`${API_URL}/auth/staff/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name, email: form.email, phone: form.phone, password: form.password })
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Staff registration failed.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setStatus({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border-2 border-[#5A1827]/20">
        <div className="text-center mb-7">
          <span className="inline-block px-3 py-1 rounded-full bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] text-[10px] font-black uppercase tracking-widest">Secure invitation</span>
          <h1 className="mt-3 text-3xl font-black text-[#5A1827]">Join hospital team</h1>
          <p className="mt-2 text-xs font-bold text-slate-500">Complete this form using the invitation provided by your Hospital Admin.</p>
        </div>

        {status.text && <div className={`${status.type === 'error' ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-emerald-100 border-emerald-300 text-emerald-800'} mb-5 border-2 rounded-xl px-4 py-3 text-xs font-bold`}>{status.text}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'email', 'phone'].map((field) => (
            <label key={field} className="block text-xs font-black uppercase tracking-wider text-[#5A1827]">
              {field === 'name' ? 'Full name' : field}
              <input name={field} type={field === 'email' ? 'email' : 'text'} required={field !== 'phone'} value={form[field]} onChange={updateField} className="mt-1 w-full rounded-xl border-2 border-[#5A1827]/20 bg-[#FAF9F6] p-3 text-sm normal-case tracking-normal focus:outline-none focus:border-[#5A1827]" />
            </label>
          ))}
          <label className="block text-xs font-black uppercase tracking-wider text-[#5A1827]">Password<input name="password" type="password" minLength="6" required value={form.password} onChange={updateField} className="mt-1 w-full rounded-xl border-2 border-[#5A1827]/20 bg-[#FAF9F6] p-3 text-sm" /></label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#5A1827]">Confirm password<input name="confirmPassword" type="password" minLength="6" required value={form.confirmPassword} onChange={updateField} className="mt-1 w-full rounded-xl border-2 border-[#5A1827]/20 bg-[#FAF9F6] p-3 text-sm" /></label>
          <button type="submit" disabled={loading || !token} className="w-full rounded-xl bg-[#5A1827] py-3 text-xs font-black uppercase tracking-widest text-[#E5C158] disabled:opacity-50">{loading ? 'Creating account...' : 'Create staff account'}</button>
        </form>
      </div>
    </div>
  );
};

export default StaffRegistration;
