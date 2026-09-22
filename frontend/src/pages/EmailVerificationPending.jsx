import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_URL, parseResponse } from '../api';

const EmailVerificationPending = () => {
  const location = useLocation();
  const email = location.state?.email || localStorage.getItem('pendingVerificationEmail') || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resendVerification = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/verify-email/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Unable to resend verification email.');
      setMessage(data.message || 'A new verification email has been sent.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg rounded-3xl border-2 border-[#5A1827]/20 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#E5C158] bg-[#E5C158]/20 text-3xl text-[#5A1827]">@</div>
        <h1 className="text-3xl font-black text-[#5A1827]">Verify Your Email</h1>
        <p className="mt-3 text-sm font-bold text-slate-600">Please verify your email address to continue.</p>
        {email && <p className="mt-4 break-all rounded-xl bg-[#FAF9F6] px-4 py-3 text-sm font-black text-[#5A1827]">{email}</p>}
        <p className="mt-4 text-xs font-semibold text-slate-500">We sent a verification link to this address. Check your inbox and spam folder, then click the link before signing in.</p>
        {error && <p className="mt-4 rounded-xl border-2 border-rose-300 bg-rose-100 px-4 py-3 text-xs font-bold text-rose-800">{error}</p>}
        {message && <p className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">{message}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={resendVerification} disabled={loading || !email} className="rounded-xl bg-[#5A1827] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#E5C158] disabled:opacity-50">{loading ? 'Sending...' : 'Resend Verification Email'}</button>
          <Link to="/login" className="rounded-xl border-2 border-[#5A1827]/20 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#5A1827]">Go to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;
