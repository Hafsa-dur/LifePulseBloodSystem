import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL, parseResponse } from '../api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verifying your email...');
  const [success, setSuccess] = useState(false);

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md rounded-3xl border-2 border-[#5A1827]/20 bg-white p-8 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black ${success ? 'border-emerald-300 bg-emerald-100 text-emerald-700' : 'border-[#E5C158] bg-[#E5C158]/20 text-[#5A1827]'}`}>
          {success ? '✓' : '♥'}
        </div>
        <h1 className="text-2xl font-black text-[#5A1827]">Email Verification</h1>
        <p className={`mt-3 text-sm font-bold ${success ? 'text-emerald-700' : 'text-slate-600'}`}>{status}</p>
        <Link to="/login" className="mt-6 inline-block rounded-xl bg-[#5A1827] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#E5C158]">Go to Sign In</Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
