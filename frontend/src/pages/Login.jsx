import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle input field value updates
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle login submit request to MongoDB Express backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log("Sending request to:", `${API_URL}/auth/login`);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Invalid credentials.');
      }

      // Save JWT token, user profile object, and userEmail in LocalStorage for Life Impact Board
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // REAL EMAIL STORAGE FOR IMPACT BOARD FILTER
      if (data.user && data.user.email) {
        localStorage.setItem('userEmail', data.user.email);
      }

      setLoading(false);

      // Safe & case-insensitive role verification
      const userRole = data.user?.role?.toString().trim().toLowerCase();

      if (userRole === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/profile');
      }

    } catch (err) {
      setLoading(false);
      setError(err.message || 'Server connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-2xl border-2 border-[#5A1827]/20">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-rose-100 border-2 border-rose-300 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <span className="text-2xl font-black text-[#990000]">♥</span>
          </div>
          <h2 className="text-3xl font-black text-[#5A1827] tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Sign in to access your LifePulse portal</p>
        </div>

        {/* Dynamic Error Banner */}
        {error && (
          <div className="bg-rose-100 border-2 border-rose-300 text-[#990000] px-4 py-3 rounded-2xl text-xs font-bold shadow-sm">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#5A1827] uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border-2 border-[#5A1827]/30 focus:outline-none focus:border-[#5A1827] text-[#5A1827] font-bold text-sm transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#5A1827] uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border-2 border-[#5A1827]/30 focus:outline-none focus:border-[#5A1827] text-[#5A1827] font-bold text-sm transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#5A1827] hover:bg-[#4A121F] text-[#E5C158] font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-950/20 active:scale-[0.99] disabled:opacity-50 border-2 border-[#E5C158]/50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs font-bold text-slate-500 pt-4 border-t-2 border-[#5A1827]/10">
          Don't have an account?{' '}
          <Link to="/register" className="font-black text-[#990000] hover:underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;