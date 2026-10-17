import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import GlobalSearch from './GlobalSearch';

const Navbar = () => {
  const [hasRegisteredAccount] = useState(() => Boolean(localStorage.getItem('user')));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="navbar-responsive bg-[#5A1827] border-b-2 border-[#E5C158]/30 py-4 px-6 md:px-12 flex justify-between items-center text-white font-sans shadow-md sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3 group">
        <BrandLogo compact inverse />
      </Link>

      {/* Navigation Links */}
      <div className="public-nav-links flex items-center gap-6 text-xs font-black uppercase tracking-wider text-rose-100">
        <Link to="/" className="hover:text-[#E5C158] transition-colors">Home</Link>
        <Link to="/about" className="hover:text-[#E5C158] transition-colors">About Us</Link>
        <Link to="/faq" className="hover:text-[#E5C158] transition-colors">FAQs</Link>
      </div>

      <div className="navbar-actions">
        <GlobalSearch variant="public" />

        <button
          type="button"
          className="mobile-public-menu-button"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true">{isMobileMenuOpen ? '×' : '☰'}</span>
        </button>

        {/* Auth Buttons */}
        <div className="navbar-auth-actions flex items-center gap-4 text-xs font-black uppercase tracking-wider">
          {hasRegisteredAccount ? (
            <Link to="/login" className="px-4 py-2 bg-[#E5C158] hover:bg-amber-300 text-[#5A1827] rounded-xl transition-all shadow-md border border-white/20">
              Sign In
            </Link>
          ) : (
            <Link to="/register" className="px-4 py-2 bg-[#E5C158] hover:bg-amber-300 text-[#5A1827] rounded-xl transition-all shadow-md border border-white/20">
              Sign Up
            </Link>
          )}
        </div>
      </div>

      <div className={`mobile-public-menu${isMobileMenuOpen ? ' mobile-public-menu-open' : ''}`}>
        <Link to="/" onClick={closeMobileMenu}>Home</Link>
        <Link to="/about" onClick={closeMobileMenu}>About Us</Link>
        <Link to="/faq" onClick={closeMobileMenu}>FAQs</Link>
      </div>
    </nav>
  );
};

export default Navbar;