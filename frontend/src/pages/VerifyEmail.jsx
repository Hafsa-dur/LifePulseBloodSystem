import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL, parseResponse } from '../api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verifying your email...');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('Verification token is missing.');
      return;
    }

    fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await parseResponse(response);
        if (!response.ok) throw new Error(data.message || 'This verification link is invalid or expired.');
        setSuccess(true);
        setStatus(data.message || 'Email verified successfully.');
      })
      .catch((error) => setStatus(error.message));
  }, [searchParams]);

  const resend = async (event) => {
    event.preventDefault();
    setResending(true);
    setResendMessage('');
    try {
      const response = await fetch(`${API_URL}/auth/verify-email/resend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resendEmail }) });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Unable to resend verification email.');
      localStorage.setItem('pendingVerificationEmail', resendEmail.trim().toLowerCase());
      setResendMessage(data.message || 'A new verification email has been sent.');
      navigate('/email-verification-pending', { replace: true, state: { email: resendEmail.trim().toLowerCase() } });
    } catch (error) {
      setResendMessage(error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md rounded-3xl border-2 border-[#5A1827]/20 bg-white p-8 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black ${success ? 'border-emerald-300 bg-emerald-100 text-emerald-700' : 'border-[#E5C158] bg-[#E5C158]/20 text-[#5A1827]'}`}>
          {success ? '✓' : '♥'}
        </div>
        <h1 className="text-2xl font-black text-[#5A1827]">Email Verification</h1>
        <p className={`mt-3 text-sm font-bold ${success ? 'text-emerald-700' : 'text-slate-600'}`}>{status}</p>
        {!success && <form onSubmit={resend} className="mt-5 space-y-3"><input required type="email" value={resendEmail} onChange={(event) => setResendEmail(event.target.value)} placeholder="Enter your email to resend" className="w-full rounded-xl border-2 border-[#5A1827]/20 bg-[#FAF9F6] px-3 py-2 text-sm font-bold text-[#5A1827]" /><button disabled={resending} className="w-full rounded-xl border-2 border-[#E5C158] bg-[#E5C158]/20 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#5A1827] disabled:opacity-50">{resending ? 'Sending...' : 'Resend Verification Email'}</button>{resendMessage && <p className="text-xs font-bold text-rose-700">{resendMessage}</p>}</form>}
        <Link to="/login" className="mt-6 inline-block rounded-xl bg-[#5A1827] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#E5C158]">Go to Sign In</Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
