import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar-responsive bg-[#5A1827] border-b-2 border-[#E5C158]/30 py-4 px-6 md:px-12 flex justify-between items-center text-white font-sans shadow-md sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E5C158] to-amber-300 flex items-center justify-center text-[#5A1827] font-black shadow-lg border border-white/20">
          ♥
        </div>
        <span className="font-black text-xl tracking-tight text-white">
          Life<span className="text-[#E5C158]">Pulse</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="public-nav-links flex items-center gap-6 text-xs font-black uppercase tracking-wider text-rose-100">
        <Link to="/" className="hover:text-[#E5C158] transition-colors">Home</Link>
        <Link to="/about" className="hover:text-[#E5C158] transition-colors">About Us</Link>
        <Link to="/faq" className="hover:text-[#E5C158] transition-colors">FAQs</Link>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-4 text-xs font-black uppercase tracking-wider">
        <Link to="/login" className="text-rose-100 hover:text-[#E5C158] transition-colors">
          Sign In
        </Link>
        <Link 
          to="/register" 
          className="px-4 py-2 bg-[#E5C158] hover:bg-amber-300 text-[#5A1827] rounded-xl transition-all shadow-md border border-white/20"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;