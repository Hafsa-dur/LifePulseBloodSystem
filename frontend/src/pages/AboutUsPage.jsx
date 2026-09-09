import React, { useState } from 'react';
import { Send, Mail, Phone, MapPin } from 'lucide-react';
import aboutImage from '../assets/About us .png';

const AboutUsPage = () => {
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Handle Web3Forms Submission directly without backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append("access_key", "086142c1-1ea1-4e42-9ddd-e2aa7c064067");
      formData.append("name", contactData.name);
      formData.append("email", contactData.email);
      formData.append("message", contactData.message);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send message. Please try again.');
      }

      setLoading(false);
      setStatusMessage({ type: 'success', text: 'Message successfully sent to your email!' });
      setContactData({ name: '', email: '', message: '' });

    } catch (err) {
      setLoading(false);
      setStatusMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#5A1827] flex flex-col justify-between font-sans">
      
      {/* Hero Section with Adjusted Background Image & Spacing */}
      <div className="relative overflow-hidden bg-[#5A1827] py-28 px-6 text-center border-b-4 border-[#E5C158]/30 shadow-2xl">
        {/* Background Image with Lower Opacity & Better Visibility */}
        <div className="absolute inset-0 z-0 opacity-35 overflow-hidden flex items-center justify-center pointer-events-none">
          <div className="transform -rotate-3 scale-125 w-full h-full flex items-center justify-center">
            <img 
              src={aboutImage} 
              alt="About Us Background" 
              className="w-full h-full object-cover filter contrast-125 brightness-90"
            />
          </div>
        </div>

        {/* Hero Content positioned neatly on top */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span className="px-4 py-1.5 bg-[#E5C158] text-[#5A1827] border-2 border-white/20 text-xs font-black rounded-full uppercase tracking-widest shadow-lg inline-block">
            About LifePulse
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase text-white drop-shadow-lg">
            Saving Lives Through Technology
          </h1>
          <p className="text-rose-100 font-bold text-sm sm:text-base max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            LifePulse is a modern blood bank & emergency management network designed to bridge the critical gap between voluntary blood donors, patients in urgent need, and hospital care units.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="py-16 max-w-5xl mx-auto px-6 w-full">
        <div className="bg-white border-2 border-[#5A1827]/20 rounded-3xl p-8 md:p-12 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Left Column: Contact Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#5A1827] uppercase tracking-tight">Get In Touch</h2>
            <p className="text-slate-600 font-medium text-xs leading-relaxed">
              Have questions or want to partner with LifePulse for a community blood drive? Send us a direct message and our support team will respond to your email.
            </p>

            <div className="space-y-4 text-xs font-bold text-[#5A1827]">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF9F6] border border-[#5A1827]/10 shadow-inner">
                <MapPin className="w-4 h-4 text-[#990000]" />
                <span>Department of Computer Science, University of Peshawar</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF9F6] border border-[#5A1827]/10 shadow-inner">
                <Phone className="w-4 h-4 text-[#990000]" />
                <span>+1 (800) 555-BLOOD</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF9F6] border border-[#5A1827]/10 shadow-inner">
                <Mail className="w-4 h-4 text-[#990000]" />
                <span>hafsasohail557@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Right Column: Real Interactive Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {statusMessage.text && (
              <div className={`p-3 border-2 font-black rounded-2xl text-center shadow-sm ${statusMessage.type === 'success' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>
                {statusMessage.text}
              </div>
            )}
            <div>
              <label className="block text-[#5A1827] font-black uppercase tracking-wider mb-1">Your Name</label>
              <input 
                type="text" 
                required 
                value={contactData.name}
                onChange={(e) => setContactData({...contactData, name: e.target.value})}
                placeholder="Hafsa Sohail"
                className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 rounded-2xl p-3 text-[#5A1827] font-bold focus:outline-none focus:border-[#5A1827] shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[#5A1827] font-black uppercase tracking-wider mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={contactData.email}
                onChange={(e) => setContactData({...contactData, email: e.target.value})}
                placeholder="hafsa@example.com"
                className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 rounded-2xl p-3 text-[#5A1827] font-bold focus:outline-none focus:border-[#5A1827] shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[#5A1827] font-black uppercase tracking-wider mb-1">Message</label>
              <textarea 
                rows="3" 
                required 
                value={contactData.message}
                onChange={(e) => setContactData({...contactData, message: e.target.value})}
                placeholder="Type your message here..."
                className="w-full bg-[#FAF9F6] border-2 border-[#5A1827]/30 rounded-2xl p-3 text-[#5A1827] font-bold focus:outline-none focus:border-[#5A1827] shadow-inner resize-none"
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-[#5A1827] hover:bg-[#4A121F] text-[#E5C158] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg border-2 border-[#E5C158]/50 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {loading ? 'Sending Message...' : 'Send Message'}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
};

export default AboutUsPage;