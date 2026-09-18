import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/hero.png';
import { API_URL, parseResponse } from '../api';
import AddBlood from './AddBlood';

const Home = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Hero Section Stats State
  const [systemStats, setSystemStats] = useState({
    criticalNeed: 'Checking...',
    totalDonors: '0 Registered Donors'
  });

  // Fetch Hero Stats
  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const res = await fetch(`${API_URL}/donations/public-stats`);
        if (res.ok) {
          const data = await parseResponse(res);
          const criticals = data.criticalGroups || [];
          const uniqueDonors = data.totalDonors || 0;

          setSystemStats({
            criticalNeed: criticals.length > 0 ? criticals.slice(0, 2).join(' & ') + ' Negative' : 'None',
            totalDonors: `${uniqueDonors}+ Registered Donors`
          });
        }
      } catch {
        setSystemStats({
          criticalNeed: 'O- & B- Negative',
          totalDonors: '850+ Donors'
        });
      }
    };
    fetchPublicStats();
  }, []);

  const handleDonateClick = () => {
    document.getElementById('public-donation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const blogs = [
    {
      id: 1,
      title: 'Why Regular Blood Donation Saves Up to 3 Lives',
      excerpt: 'Discover how a single blood donation bag can be separated into red cells, plasma, and platelets to help multiple emergency patients.',
      date: 'Aug 20, 2026'
    },
    {
      id: 2,
      title: 'Preparation Tips Before Donating Blood',
      excerpt: 'Stay hydrated, eat an iron-rich meal, and get good rest. Learn what you should do before stepping into a LifePulse donation drive.',
      date: 'Aug 15, 2026'
    }
  ];

  const quotes = [
    {
      text: "Tears of a mother cannot save her child, but your blood can.",
      author: "LifePulse Motto"
    },
    {
      text: "Every blood donor is a real-life superhero in disguise.",
      author: "Awareness Campaign"
    }
  ];

  const reviews = [
    {
      name: "Sajid Rehman",
      role: "Patient Family Member",
      comment: "LifePulse helped us arrange 3 units of O+ blood during my father's surgery within 30 minutes. The quick request system is a lifesaver!",
      rating: 5
    },
    {
      name: "Dr. Ayesha Malik",
      role: "Emergency Care Unit",
      comment: "The real-time coordination between LifePulse and hospitals reduces emergency dispatch delay drastically.",
      rating: 5
    }
  ];

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#5A1827] font-sans selection:bg-[#E5C158] selection:text-[#5A1827]">
      
      {/* 1. HERO SECTION (Maroon & Gold Theme) */}
      <div className="bg-gradient-to-r from-[#5A1827] via-[#4A121F] to-[#5A1827] text-white py-24 px-4 sm:px-6 lg:px-8 border-b-4 border-[#E5C158]/30 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#E5C158]/20 text-[#E5C158] border border-[#E5C158]/40 text-xs font-black tracking-widest uppercase shadow-md">
              LifePulse Blood Management System
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight uppercase drop-shadow-md">
              Every Drop Counts. <br />
              <span className="text-[#E5C158]">Save Lives Today.</span>
            </h1>
            <p className="text-rose-100 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Connecting real-time blood donors with hospitals and critical care units. Streamline inventory management and digitize donor passports effortlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button
                onClick={handleDonateClick}
                className="px-8 py-4 bg-[#E5C158] hover:bg-[#d4b04d] text-[#5A1827] font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-black/20 transition-all duration-300 hover:scale-105 active:scale-[0.98] text-center cursor-pointer border-2 border-white/30"
              >
                Donate Blood Now
              </button>
            </div>
          </div>

          {/* Dynamic Live System Status Card */}
          <div className="flex-1 w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border-2 border-white/20 shadow-2xl space-y-6 transition-all duration-300 hover:bg-white/15 hover:border-[#E5C158]/50 hover:shadow-[0_0_30px_rgba(229,193,88,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#E5C158] tracking-widest">Live System Status</span>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5C158] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E5C158]"></span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-[#5A1827]/70 rounded-2xl border border-white/10 flex justify-between items-center transition-all duration-300 hover:bg-[#5A1827] hover:border-[#E5C158]/40 shadow-inner">
                  <div>
                    <p className="text-xs text-rose-200 font-bold uppercase tracking-wider">Critical Blood Need</p>
                    <p className="font-black text-white text-lg tracking-wide">{systemStats.criticalNeed}</p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-[#E5C158] text-[#5A1827] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md">Urgent</span>
                </div>

                <div className="p-5 bg-[#5A1827]/70 rounded-2xl border border-white/10 flex justify-between items-center transition-all duration-300 hover:bg-[#5A1827] hover:border-[#E5C158]/40 shadow-inner">
                  <div>
                    <p className="text-xs text-rose-200 font-bold uppercase tracking-wider">Total Registered Donors</p>
                    <p className="font-black text-white text-lg tracking-wide">{systemStats.totalDonors}</p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md">Active</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

       {/* 2. PUBLIC BLOOD DONATION FORM SECTION */}
      <section id="public-donation-form" className="py-20 bg-[#FAF9F6] px-4">
        <div className="max-w-xl mx-auto">
          <AddBlood />
        </div>
      </section>

      {/* 3. EXACT IMPACT SECTION WITH BACKGROUND IMAGE */}
      <section className="relative py-28 px-6 md:px-16 lg:px-24 text-white overflow-hidden min-h-[550px] flex flex-col justify-center border-b-4 border-[#E5C158]/30">
        
        {/* Full Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Blood Donor Impact Background" 
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          {/* Rich Maroon Tinted Dark Overlay */}
          <div className="absolute inset-0 bg-[#5A1827]/85 backdrop-blur-[2px]"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto w-full space-y-12">
          
          <div className="max-w-3xl space-y-6">
            <div className="inline-block px-4 py-1.5 bg-[#E5C158] text-[#5A1827] border-2 border-white/20 text-xs font-black rounded-full uppercase tracking-widest shadow-lg">
              Our Mission & Impact
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-wide drop-shadow-md">
              IMPACT THAT <span className="text-[#E5C158] underline decoration-[#E5C158]/60">TRANSFORMS</span> LIVES
            </h2>
            
            <p className="text-base md:text-lg text-rose-100 font-bold leading-relaxed max-w-2xl drop-shadow">
              Anyone whose life has been touched by blood donation understands its power to save communities. Every single drop bridges the gap between emergency and hope.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/20 max-w-xl">
              <div className="bg-black/20 p-4 rounded-2xl border border-white/10 shadow-inner">
                <h3 className="text-2xl md:text-3xl font-black text-[#E5C158]">10K+</h3>
                <p className="text-xs md:text-sm text-rose-100 font-bold mt-1">Lives Saved</p>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/10 shadow-inner">
                <h3 className="text-2xl md:text-3xl font-black text-[#E5C158]">100%</h3>
                <p className="text-xs md:text-sm text-rose-100 font-bold mt-1">Verified Donors</p>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/10 shadow-inner">
                <h3 className="text-2xl md:text-3xl font-black text-[#E5C158]">24/7</h3>
                <p className="text-xs md:text-sm text-rose-100 font-bold mt-1">Support Ready</p>
              </div>
            </div>
          </div>

          <div className="text-left pt-8 border-t border-white/20 max-w-4xl space-y-3">
            <h3 className="text-2xl font-black text-white tracking-wide uppercase">
              Strengthening Communities
            </h3>
            <p className="text-rose-100 text-sm md:text-base font-bold leading-relaxed max-w-3xl">
              A healthier community needs a sustainable blood supply. Every day, patients face medical emergencies, surgeries, and critical care needs. Their demand for a safe, sufficient blood supply has never been greater.
            </p>
          </div>

        </div>
      </section>

      {/* 4. BLOGS SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="mb-10 text-center sm:text-left">
          <span className="text-xs font-black text-[#5A1827] uppercase tracking-widest bg-[#E5C158]/30 px-3 py-1 rounded-full border border-[#E5C158]/50">Resources</span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#5A1827] mt-2">LifePulse Blogs</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white border-2 border-[#5A1827]/15 p-8 rounded-[2rem] space-y-4 shadow-xl hover:border-[#5A1827]/40 transition duration-300">
              <span className="text-xs text-[#5A1827] bg-[#E5C158]/20 font-black px-3 py-1 rounded-lg border border-[#E5C158]/40 uppercase tracking-widest inline-block">{blog.date}</span>
              <h3 className="font-black text-lg text-[#5A1827] leading-snug">{blog.title}</h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">{blog.excerpt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INSPIRATIONAL QUOTES SECTION */}
      <section className="py-16 bg-[#5A1827] text-white border-y-4 border-[#E5C158]/30 px-6 shadow-xl">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="text-5xl text-[#E5C158] font-serif">“</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {quotes.map((q, i) => (
              <div key={i} className="p-6 bg-white/10 rounded-2xl border border-white/15 shadow-inner italic text-rose-100 text-sm font-semibold">
                "{q.text}"
                <span className="block not-italic font-black text-[#E5C158] text-xs uppercase tracking-widest mt-3">- {q.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. REVIEWS SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-black text-[#5A1827] uppercase tracking-widest bg-[#E5C158]/30 px-3 py-1 rounded-full border border-[#E5C158]/50">Testimonials</span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#5A1827]">What People Say About LifePulse</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white border-2 border-[#5A1827]/15 p-8 rounded-[2rem] space-y-4 shadow-xl hover:border-[#5A1827]/40 transition duration-300">
              <div className="flex gap-1.5 text-[#E5C158] font-bold text-base">★★★★★</div>
              <p className="text-slate-700 text-sm font-medium italic leading-relaxed">"{r.comment}"</p>
              <div className="pt-2 border-t border-[#5A1827]/10 flex flex-col">
                <h4 className="font-black text-sm text-[#5A1827]">{r.name}</h4>
                <span className="text-xs font-bold text-rose-700/80">{r.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;