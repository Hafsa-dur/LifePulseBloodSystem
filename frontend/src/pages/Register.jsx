import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL, parseResponse } from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bloodGroup: 'O+',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Handle Input Field Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Registration Request to Express/MongoDB Backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      // POST Request to Node.js/Express MongoDB Auth Register Endpoint
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bloodGroup: formData.bloodGroup,
          password: formData.password,
          role: 'donor', // Default Role
        }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      setLoading(false);
      navigate('/login');

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
            <span className="text-2xl font-black text-[#990000]">+</span>
          </div>
          <h2 className="text-3xl font-black text-[#5A1827] tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Join LifePulse as a blood donor or recipient
          </p>
        </div>

        {/* Dynamic Error Notification Banner */}
        {error && (
          <div className="bg-rose-100 border-2 border-rose-300 text-[#990000] px-4 py-3 rounded-2xl text-xs font-bold shadow-sm">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-black text-[#5A1827] uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border-2 border-[#5A1827]/30 focus:outline-none focus:border-[#5A1827] text-[#5A1827] font-bold text-sm transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#5A1827] uppercase tracking-wider mb-1">
                Email Address
              </label>
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
              <label className="block text-xs font-black text-[#5A1827] uppercase tracking-wider mb-1">
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3 py-3 rounded-2xl bg-[#FAF9F6] border-2 border-[#5A1827]/30 focus:outline-none focus:border-[#5A1827] text-[#5A1827] font-black text-sm transition-all shadow-inner cursor-pointer"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg} className="bg-white text-[#5A1827] font-bold">
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#5A1827] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength="6"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border-2 border-[#5A1827]/30 focus:outline-none focus:border-[#5A1827] text-[#5A1827] font-bold text-sm transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#5A1827] uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength="6"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border-2 border-[#5A1827]/30 focus:outline-none focus:border-[#5A1827] text-[#5A1827] font-bold text-sm transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#5A1827] hover:bg-[#4A121F] text-[#E5C158] font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-950/20 active:scale-[0.99] disabled:opacity-50 mt-2 border-2 border-[#E5C158]/50 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Navigation Footer */}
        <div className="text-center text-xs font-bold text-slate-500 pt-4 border-t-2 border-[#5A1827]/10">
          Already registered?{' '}
          <Link to="/login" className="font-black text-[#990000] hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
